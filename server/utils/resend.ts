export interface SendEmailPayload {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  simulated?: boolean
  error?: string
}

export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const config = useRuntimeConfig()
  const resendApiKey = config.resendApiKey || process.env.RESEND_API_KEY
  const resendFromEmail = config.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'Financial Tracker <onboarding@resend.dev>'

  const toList = Array.isArray(payload.to) ? payload.to : [payload.to]

  // 1. Try Resend API if API key is provided
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: payload.from || resendFromEmail,
          to: toList,
          subject: payload.subject,
          html: payload.html
        })
      })

      const data = await response.json().catch(() => ({})) as { id?: string, message?: string, error?: { message?: string } | string }

      if (!response.ok) {
        const errorMsg = data.message || (typeof data.error === 'object' ? data.error?.message : data.error) || `Resend Error (Status ${response.status})`
        throw new Error(errorMsg)
      }

      return {
        success: true,
        messageId: data.id,
        simulated: false
      }
    } catch (err: unknown) {
      const error = err as Error
      console.error('[Resend Error]', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 2. Fallback to SMTP if SMTP environment variables are configured
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      })

      const info = await transporter.sendMail({
        from: payload.from || process.env.SMTP_FROM || smtpUser,
        to: toList.join(', '),
        subject: payload.subject,
        html: payload.html
      })

      return {
        success: true,
        messageId: info.messageId,
        simulated: false
      }
    } catch (err: unknown) {
      const error = err as Error
      console.error('[SMTP Error]', error.message)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // 3. Fallback: Simulation mode for local development
  console.info('\n--- [EMAIL SIMULATOR] ---')
  console.info(`To: ${toList.join(', ')}`)
  console.info(`Subject: ${payload.subject}`)
  console.info('Status: Simulated (add RESEND_API_KEY to .env to deliver live emails)')
  console.info('-------------------------\n')

  return {
    success: true,
    messageId: `simulated-${Date.now()}`,
    simulated: true
  }
}
