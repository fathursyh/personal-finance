import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event as any)
  const cronSecret = config.cronSecret || process.env.CRON_SECRET || 'finance-cron-secret-key'
  const appUrl = config.public.appUrl || 'http://localhost:3000'

  const authHeader = getHeader(event, 'x-cron-secret') || getHeader(event, 'authorization')?.replace('Bearer ', '')
  const query = getQuery(event)
  const body = await readBody(event).catch(() => ({})) as { month?: string }

  const isCronAuthorized = (authHeader && authHeader === cronSecret) || (query.cron_secret && query.cron_secret === cronSecret)

  const targetMonth = body?.month || (typeof query.month === 'string' && query.month) || new Date().toISOString().slice(0, 7)

  if (isCronAuthorized) {
    let serviceClient: ReturnType<typeof serverSupabaseServiceRole<Database>>
    try {
      serviceClient = serverSupabaseServiceRole<Database>(event as any)
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: 'SUPABASE_SERVICE_ROLE_KEY is required for automated cron executions.'
      })
    }

    const [yearStr, monthStr] = targetMonth.split('-')
    const year = Number.parseInt(yearStr ?? '', 10)
    const month = Number.parseInt(monthStr ?? '', 10)
    const startDate = `${targetMonth}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${targetMonth}-${String(lastDay).padStart(2, '0')}`

    // Find all distinct users who have transactions in target month
    const { data: activeTxs, error: txError } = await serviceClient
      .from('transactions')
      .select('user_id')
      .gte('date', startDate)
      .lte('date', endDate)

    if (txError) throw txError

    const activeUserIds = Array.from(new Set((activeTxs || []).map(t => t.user_id)))
    const results = []

    for (const userId of activeUserIds) {
      try {
        const { data: authUser, error: userError } = await serviceClient.auth.admin.getUserById(userId)
        if (userError || !authUser?.user?.email) continue

        const userEmail = authUser.user.email
        const userName = (authUser.user.user_metadata?.name as string | undefined) || userEmail.split('@')[0] || 'User'

        const summary = await compileUserMonthlySummary(
          serviceClient,
          userId,
          userEmail,
          userName,
          targetMonth,
          appUrl
        )

        if (!summary.hasTransactions || !summary.data) continue

        const html = generateMonthlySummaryHtml(summary.data)
        const emailResult = await sendEmail({
          to: userEmail,
          subject: `📊 Laporan Keuangan Bulanan - ${summary.data.monthLabel}`,
          html
        })

        results.push({
          userId,
          email: userEmail,
          success: emailResult.success,
          simulated: emailResult.simulated
        })
      } catch (err: unknown) {
        const e = err as Error
        console.error(`[Monthly Summary Cron] Error processing user ${userId}:`, e.message)
      }
    }

    return {
      success: true,
      mode: 'cron',
      targetMonth,
      totalActiveUsers: activeUserIds.length,
      emailsProcessed: results.length,
      details: results
    }
  }

  // ==========================================
  // 2. MANUAL USER MODE: Send to logged-in user
  // ==========================================
  const user = await serverSupabaseUser(event as any)
  if (!user || !user.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Please sign in or provide a valid cron secret.'
    })
  }

  const supabase = await serverSupabaseClient<Database>(event as any)
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData?.user?.id || (user as { sub?: string, id?: string }).sub || (user as { sub?: string, id?: string }).id

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Could not identify user session.'
    })
  }

  const userEmail = authData?.user?.email || user.email || ''
  const userName = (authData?.user?.user_metadata?.name as string | undefined)
    || (user.user_metadata?.name as string | undefined)
    || userEmail.split('@')[0]
    || 'User'

  const summary = await compileUserMonthlySummary(
    supabase,
    userId,
    userEmail,
    userName,
    targetMonth,
    appUrl
  )

  if (!summary.hasTransactions || !summary.data) {
    return {
      success: false,
      message: 'Anda belum memiliki transaksi pada bulan ini. Tambahkan transaksi terlebih dahulu untuk menerima laporan pengeluaran.'
    }
  }

  const html = generateMonthlySummaryHtml(summary.data)
  const emailResult = await sendEmail({
    to: userEmail,
    subject: `📊 Laporan Keuangan Bulanan - ${summary.data.monthLabel}`,
    html
  })

  if (!emailResult.success) {
    return {
      success: false,
      mode: 'manual',
      email: userEmail,
      message: emailResult.error || 'Gagal mengirim email melalui Resend.'
    }
  }

  return {
    success: true,
    mode: 'manual',
    email: userEmail,
    simulated: emailResult.simulated,
    message: emailResult.simulated
      ? 'Email berhasil disimulasikan di terminal server! Tambahkan RESEND_API_KEY ke file .env untuk pengiriman nyata ke inbox.'
      : `Laporan bulanan berhasil dikirim ke ${userEmail}!`
  }
})
