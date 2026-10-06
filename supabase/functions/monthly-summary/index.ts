// Supabase Edge Function: monthly-summary
// Triggered on the last day of each month to email active users their spending report
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const RESEND_FROM = Deno.env.get('RESEND_FROM_EMAIL') || 'Financial Tracker <onboarding@resend.dev>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') || 'financial-fathur-ganteng'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

Deno.serve(async (req) => {
  // Check authorization
  const authHeader = req.headers.get('x-cron-secret') || req.headers.get('Authorization')?.replace('Bearer ', '')
  if (authHeader !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const now = new Date()
  const yearMonth = now.toISOString().slice(0, 7)
  const [yearStr, monthStr] = yearMonth.split('-')
  const year = Number.parseInt(yearStr ?? '', 10)
  const month = Number.parseInt(monthStr ?? '', 10)
  const startDate = `${yearMonth}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`

  const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  // Find users with transactions this month
  const { data: activeTxs, error: txError } = await supabase
    .from('transactions')
    .select('user_id')
    .gte('date', startDate)
    .lte('date', endDate)

  if (txError) {
    return new Response(JSON.stringify({ error: txError.message }), { status: 500 })
  }

  const userIds = Array.from(new Set((activeTxs || []).map((t: { user_id: string }) => t.user_id)))
  const results = []

  for (const userId of userIds) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      if (!authUser?.user?.email) continue

      const userEmail = authUser.user.email
      const userName = (authUser.user.user_metadata?.name as string | undefined) || userEmail.split('@')[0] || 'User'

      // Fetch user data
      const { data: userTxs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)

      const { data: userBudgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)

      const txs = userTxs || []
      const budgets = userBudgets || []

      const totalSpent = txs
        .filter((t: { type: string }) => t.type === 'expense')
        .reduce((sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0), 0)

      const totalIncome = txs
        .filter((t: { type: string }) => t.type === 'income')
        .reduce((sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0), 0)

      const totalBudget = budgets.reduce((sum: number, b: { amount: number }) => sum + (Number(b.amount) || 0), 0)

      const budgetRows = budgets.map((b: { id: string, name: string, amount: number }) => {
        const spent = txs
          .filter((t: { budget_id: string | null, type: string }) => t.budget_id === b.id && t.type === 'expense')
          .reduce((sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0), 0)
        const income = txs
          .filter((t: { budget_id: string | null, type: string }) => t.budget_id === b.id && t.type === 'income')
          .reduce((sum: number, t: { amount: number }) => sum + (Number(t.amount) || 0), 0)
        const netSpent = Math.max(0, spent - income)
        const remaining = Number(b.amount) - spent + income

        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${b.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatRupiah(Number(b.amount))}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatRupiah(netSpent)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${formatRupiah(Math.max(0, remaining))}</td>
          </tr>
        `
      }).join('')

      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2>Laporan Keuangan Bulanan - ${monthLabel}</h2>
          <p>Halo <strong>${userName}</strong>, berikut adalah rangkuman pengeluaran dan status anggaran Anda di akhir bulan:</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Total Pengeluaran:</strong> ${formatRupiah(totalSpent)}</p>
            <p style="margin: 4px 0;"><strong>Total Pemasukan:</strong> ${formatRupiah(totalIncome)}</p>
            <p style="margin: 4px 0;"><strong>Total Anggaran:</strong> ${formatRupiah(totalBudget)}</p>
            <p style="margin: 4px 0;"><strong>Sisa Anggaran:</strong> ${formatRupiah(Math.max(0, totalBudget - totalSpent))}</p>
          </div>
          <h3>Rincian Anggaran:</h3>
          <table width="100%" style="border-collapse: collapse;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 8px;">Kategori</th>
                <th style="padding: 8px; text-align: right;">Target</th>
                <th style="padding: 8px; text-align: right;">Terpakai</th>
                <th style="padding: 8px; text-align: right;">Sisa</th>
              </tr>
            </thead>
            <tbody>${budgetRows}</tbody>
          </table>
        </div>
      `

      if (RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: userEmail,
            subject: `📊 Laporan Keuangan Bulanan - ${monthLabel}`,
            html
          })
        })
      }

      results.push({ email: userEmail, success: true })
    } catch (err: unknown) {
      console.error(err)
    }
  }

  return new Response(JSON.stringify({ success: true, processed: results.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
