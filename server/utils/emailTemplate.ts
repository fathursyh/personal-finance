export interface MonthlySummaryBudget {
  name: string
  icon?: string | null
  color?: string | null
  allocated: number
  spent: number
  remaining: number
  percentage: number
  status: 'normal' | 'warning' | 'exceeded'
}

export interface MonthlySummaryData {
  userName: string
  userEmail: string
  monthLabel: string
  totalSpent: number
  totalIncome: number
  totalBudget: number
  totalRemaining: number
  overallPercentage: number
  transactionCount: number
  budgets: MonthlySummaryBudget[]
  topCategory?: {
    name: string
    spent: number
    share: number
  } | null
  appUrl: string
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function generateMonthlySummaryHtml(data: MonthlySummaryData): string {
  const {
    userName,
    monthLabel,
    totalSpent,
    totalIncome,
    totalBudget,
    totalRemaining,
    overallPercentage,
    budgets,
    topCategory,
    appUrl
  } = data

  const isOverBudget = totalRemaining < 0
  const remainingColor = isOverBudget ? '#ef4444' : '#10b981'
  const netFlow = totalIncome - totalSpent

  const budgetRowsHtml = budgets.map((b) => {
    const isExceeded = b.remaining < 0
    const statusBg = isExceeded ? '#fee2e2' : b.status === 'warning' ? '#fef3c7' : '#ecfdf5'
    const statusColor = isExceeded ? '#991b1b' : b.status === 'warning' ? '#92400e' : '#065f46'
    const statusText = isExceeded ? `Over by ${formatRupiah(Math.abs(b.remaining))}` : `${b.percentage}% used`
    const barColor = isExceeded ? '#ef4444' : b.status === 'warning' ? '#f59e0b' : '#3b82f6'

    return `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b;">
          ${b.name}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #475569;">
          ${formatRupiah(b.allocated)}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #0f172a; font-weight: 600;">
          ${formatRupiah(b.spent)}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: ${isExceeded ? '#ef4444' : '#0f172a'};">
          ${formatRupiah(Math.max(0, b.remaining))}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #f1f5f9; text-align: right;">
          <div style="display: inline-block; background-color: ${statusBg}; color: ${statusColor}; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 9999px;">
            ${statusText}
          </div>
          <div style="background-color: #e2e8f0; height: 4px; border-radius: 9999px; margin-top: 6px; overflow: hidden;">
            <div style="background-color: ${barColor}; height: 100%; width: ${Math.min(100, b.percentage)}%;"></div>
          </div>
        </td>
      </tr>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Keuangan Bulanan - ${monthLabel}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.5;">
  <div style="max-width: 620px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 8px 14px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
        Financial Tracker
      </div>
      <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
        Monthly Financial Summary
      </h1>
      <p style="margin: 0; font-size: 14px; color: #94a3b8;">
        Laporan Pengeluaran & Anggaran untuk <strong>${monthLabel}</strong>
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 28px 24px;">
      
      <!-- Greeting -->
      <p style="margin: 0 0 20px 0; font-size: 15px; color: #334155;">
        Halo <strong>${userName}</strong>, berikut adalah rangkuman pengeluaran dan status sisa anggaran belanja Anda pada akhir bulan ini:
      </p>

      <!-- KPI Summary Grid -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
          <td width="50%" style="padding: 6px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Total Pengeluaran</span>
              <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">
                ${formatRupiah(totalSpent)}
              </div>
              <span style="font-size: 12px; color: #64748b;">${overallPercentage}% dari total budget</span>
            </div>
          </td>
          <td width="50%" style="padding: 6px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Total Anggaran</span>
              <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">
                ${formatRupiah(totalBudget)}
              </div>
              <span style="font-size: 12px; color: #64748b;">${budgets.length} kategori budget</span>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding: 6px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Sisa Anggaran</span>
              <div style="font-size: 20px; font-weight: 800; color: ${remainingColor}; margin-top: 4px;">
                ${formatRupiah(Math.max(0, totalRemaining))}
              </div>
              <span style="font-size: 12px; font-weight: 600; color: ${remainingColor};">
                ${isOverBudget ? 'Melebihi budget!' : 'Aman terkendali'}
              </span>
            </div>
          </td>
          <td width="50%" style="padding: 6px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px;">Net Cashflow</span>
              <div style="font-size: 20px; font-weight: 800; color: ${netFlow >= 0 ? '#10b981' : '#ef4444'}; margin-top: 4px;">
                ${netFlow >= 0 ? '+' : ''}${formatRupiah(netFlow)}
              </div>
              <span style="font-size: 12px; color: #64748b;">Pemasukan: ${formatRupiah(totalIncome)}</span>
            </div>
          </td>
        </tr>
      </table>

      ${topCategory
        ? `
      <!-- Highlight Card -->
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <span style="font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px;">Kategori Terbesar</span>
        <div style="font-size: 14px; color: #1e3a8a; margin-top: 2px;">
          Pengeluaran terbesar Anda bulan ini ada pada <strong>${topCategory.name}</strong> sebesar <strong>${formatRupiah(topCategory.spent)}</strong> (${topCategory.share}% dari seluruh pengeluaran).
        </div>
      </div>
      `
        : ''}

      <!-- Detailed Budgets Section -->
      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 28px 0 12px 0;">
        Rincian Anggaran (Budget Breakdown)
      </h3>

      ${budgets.length > 0
        ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left;">
            <th style="padding: 10px 14px; font-weight: 700; color: #475569; border-top-left-radius: 8px;">Kategori</th>
            <th style="padding: 10px 14px; font-weight: 700; color: #475569; text-align: right;">Target</th>
            <th style="padding: 10px 14px; font-weight: 700; color: #475569; text-align: right;">Terpakai</th>
            <th style="padding: 10px 14px; font-weight: 700; color: #475569; text-align: right;">Sisa</th>
            <th style="padding: 10px 14px; font-weight: 700; color: #475569; text-align: right; border-top-right-radius: 8px;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${budgetRowsHtml}
        </tbody>
      </table>
      `
        : `
      <p style="font-size: 13px; color: #64748b; font-style: italic; margin-bottom: 24px;">
        Anda belum membuat kategori budget khusus bulan ini.
      </p>
      `}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
          Buka Dashboard Financial Tracker &rarr;
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b;">
      <p style="margin: 0 0 6px 0;">
        Email rangkuman ini dikirimkan otomatis di akhir bulan karena Anda memiliki aktivitas transaksi pada <strong>${monthLabel}</strong>.
      </p>
      <p style="margin: 0; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} Financial Tracker. Hak cipta dilindungi.
      </p>
    </div>

  </div>
</body>
</html>
  `
}
