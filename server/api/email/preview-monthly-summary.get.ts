import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event as any)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Please sign in to preview your monthly summary.'
    })
  }

  const query = getQuery(event)
  const targetMonth = (typeof query.month === 'string' && query.month)
    ? query.month
    : new Date().toISOString().slice(0, 7)

  const config = useRuntimeConfig(event as any)
  const appUrl = config.public.appUrl || 'http://localhost:3000'

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

  let html: string
  if (summary.hasTransactions && summary.data) {
    html = generateMonthlySummaryHtml(summary.data)
  } else {
    // Generate a preview with sample demo data if user doesn't have transactions for this month yet
    const demoData = {
      userName,
      userEmail,
      monthLabel: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      totalSpent: 3500000,
      totalIncome: 8000000,
      totalBudget: 5000000,
      totalRemaining: 1500000,
      overallPercentage: 70,
      transactionCount: 14,
      budgets: [
        {
          name: 'Makanan & Minuman',
          allocated: 2000000,
          spent: 1650000,
          remaining: 350000,
          percentage: 83,
          status: 'warning' as const
        },
        {
          name: 'Transportasi',
          allocated: 1000000,
          spent: 600000,
          remaining: 400000,
          percentage: 60,
          status: 'normal' as const
        },
        {
          name: 'Hiburan',
          allocated: 1000000,
          spent: 1250000,
          remaining: -250000,
          percentage: 125,
          status: 'exceeded' as const
        },
        {
          name: 'Tagihan & Utilitas',
          allocated: 1000000,
          spent: 0,
          remaining: 1000000,
          percentage: 0,
          status: 'normal' as const
        }
      ],
      topCategory: {
        name: 'Makanan & Minuman',
        spent: 1650000,
        share: 47
      },
      appUrl
    }
    html = generateMonthlySummaryHtml(demoData)
  }

  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  return html
})
