import { GoogleGenAI, Type } from '@google/genai'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database, PaymentMethod, TransactionType } from '~/types/database.types'

export interface ParsedTransactionItem {
  id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  payment_method: PaymentMethod
  budget_id: string | null
  is_potential_duplicate: boolean
  duplicate_reason?: string
  selected: boolean
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event as any)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Please login to upload bank statements.'
    })
  }

  const config = useRuntimeConfig()
  const geminiApiKey = (config.geminiApiKey as string | undefined) || process.env.GEMINI_API_KEY
  if (!geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'GEMINI_API_KEY is not configured on the server. Please add your Gemini API Key in .env to use statement import.'
    })
  }

  // Parse multipart form
  const formParts = await readMultipartFormData(event)
  if (!formParts || formParts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No file uploaded. Please upload a bank statement file.'
    })
  }

  const filePart = formParts.find(p => p.name === 'file' || p.filename)
  if (!filePart || !filePart.data || filePart.data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Empty or invalid file uploaded.'
    })
  }

  const filename = filePart.filename || 'statement'
  const mimeType = filePart.type || 'application/octet-stream'
  const isPdf = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf')
  const isCsvOrText = mimeType.includes('csv') || mimeType.includes('text') || filename.toLowerCase().endsWith('.csv') || filename.toLowerCase().endsWith('.txt')

  if (!isPdf && !isCsvOrText) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported format. Please upload a PDF, CSV, or TXT bank statement.'
    })
  }

  const supabase = await serverSupabaseClient<Database>(event as any)

  // 1. Fetch user's existing budgets for smart categorization
  const { data: userBudgets } = await supabase
    .from('budgets')
    .select('id, name')
    .eq('user_id', user.id)

  const budgetOptionsPrompt = (userBudgets && userBudgets.length > 0)
    ? `Here are the user's active budget categories (category name -> id):
${userBudgets.map(b => `- "${b.name}" (id: "${b.id}")`).join('\n')}
Match each expense to the most appropriate category id. If none match or if it is general income, return null for budget_id.`
    : `The user currently has no custom budget categories created. Set budget_id to null.`

  // 2. Prepare payload for Gemini
  const ai = new GoogleGenAI({ apiKey: geminiApiKey })

  const systemInstruction = `You are an expert financial document and bank statement parser.
Your task is to extract all banking and financial transactions from the provided document accurately.

Guidelines:
1. Extract every legitimate transaction line (expenses, purchases, debits, income, salary, transfers in, deposits).
2. Skip purely administrative lines, opening balances, closing balances, ledger headers, credit limits, or interest rate summaries.
3. Determine:
   - "date": Date in standard ISO format YYYY-MM-DD. (Infer year from statement context; if statement is in Indonesian format DD/MM/YYYY or DD-Mon-YYYY, convert correctly).
   - "description": Clean, readable description of the transaction (e.g. merchant name, transfer note, counterparty). Remove meaningless raw codes if possible while retaining payee/purpose.
   - "amount": Positive number (always > 0). Never negative.
   - "type": "expense" for debits / purchases / money sent / fees; "income" for credits / deposits / salary / money received.
   - "payment_method": One of: "Bank Transfer", "Debit Card", "Credit Card", "QRIS", "E-Wallet", "Cash". Infer appropriately (e.g. QRIS payment -> "QRIS", EDC/Debit purchase -> "Debit Card", Transfer/BI-FAST -> "Bank Transfer").
   - "budget_id": ${budgetOptionsPrompt}
`

  let parsedRawTransactions: Array<{
    date: string
    description: string
    amount: number
    type: 'expense' | 'income'
    payment_method: PaymentMethod
    budget_id: string | null
  }>

  try {
    const contents: Array<{ inlineData?: { mimeType: string, data: string }, text?: string }> = []

    if (isPdf) {
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: filePart.data.toString('base64')
        }
      })
      contents.push({
        text: 'Extract all transaction items from this bank statement into structured JSON following the schema.'
      })
    } else {
      // Text or CSV
      const textContent = filePart.data.toString('utf-8')
      contents.push({
        text: `Here is the bank statement file content:\n\n${textContent}\n\nExtract all transaction items into structured JSON following the schema.`
      })
    }

    // Modern Gemini 3 series models with fallback hierarchy
    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview'
    ]

    let responseText = ''
    let lastError: unknown = null

    for (const modelName of candidateModels) {
      // Allow up to 2 attempts per model (with a short backoff for transient 503s)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                description: 'List of extracted bank statement transactions',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: 'ISO date YYYY-MM-DD' },
                    description: { type: Type.STRING, description: 'Merchant or description' },
                    amount: { type: Type.NUMBER, description: 'Positive transaction amount' },
                    type: { type: Type.STRING, enum: ['expense', 'income'] },
                    payment_method: {
                      type: Type.STRING,
                      enum: ['Bank Transfer', 'Debit Card', 'Credit Card', 'QRIS', 'E-Wallet', 'Cash']
                    },
                    budget_id: { type: Type.STRING, nullable: true }
                  },
                  required: ['date', 'description', 'amount', 'type', 'payment_method']
                }
              }
            }
          })

          responseText = response.text || '[]'
          lastError = null
          break
        } catch (err: unknown) {
          lastError = err
          const errMessage = (err as { message?: string })?.message || ''
          console.warn(`Model ${modelName} (attempt ${attempt}) failed or busy (${errMessage})`)
          if (attempt === 1 && errMessage.includes('503')) {
            // Transient 503: wait 1 second before retrying this model
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      if (responseText) {
        break
      }
    }

    if (!responseText && lastError) {
      throw lastError
    }

    parsedRawTransactions = JSON.parse(responseText || '[]')
  } catch (err: unknown) {
    const error = err as { message?: string }
    console.error('Gemini Statement Parse Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `AI statement service is temporarily busy: ${error.message || 'Please try again in a few moments.'}`
    })
  }

  if (!Array.isArray(parsedRawTransactions) || parsedRawTransactions.length === 0) {
    return {
      success: true,
      filename,
      items: []
    }
  }

  // 3. Duplicate detection: Query existing transactions around the extracted date range
  const dates = parsedRawTransactions.map(t => t.date).filter(Boolean).sort()
  const minDate = dates[0] || new Date().toISOString().slice(0, 10)
  const maxDate = dates[dates.length - 1] || new Date().toISOString().slice(0, 10)

  const { data: existingTransactions } = await supabase
    .from('transactions')
    .select('id, date, amount, description, type')
    .eq('user_id', user.id)
    .gte('date', minDate)
    .lte('date', maxDate)

  const existingMap = new Set<string>()
  if (existingTransactions) {
    for (const ex of existingTransactions) {
      // Normalize comparison key: date_amount_simplifiedDescription
      const simplifiedDesc = ex.description.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
      existingMap.add(`${ex.date}_${Number(ex.amount)}_${simplifiedDesc}`)
      // Also check exact date + amount
      existingMap.add(`${ex.date}_${Number(ex.amount)}`)
    }
  }

  const validBudgetIds = new Set((userBudgets || []).map(b => b.id))

  // 4. Assemble final verified items with duplicate detection
  const items: ParsedTransactionItem[] = parsedRawTransactions.map((item, index) => {
    const simplifiedDesc = (item.description || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
    const exactMatch = existingMap.has(`${item.date}_${Number(item.amount)}_${simplifiedDesc}`)
    const amountDateMatch = existingMap.has(`${item.date}_${Number(item.amount)}`)

    const isDuplicate = exactMatch || amountDateMatch
    let duplicateReason: string | undefined
    if (exactMatch) {
      duplicateReason = 'Matches an existing transaction with identical date, amount, and description.'
    } else if (amountDateMatch) {
      duplicateReason = 'Existing transaction found with identical date and amount.'
    }

    // Ensure suggested budget_id is a valid UUID belonging to this user
    const matchedBudgetId = item.budget_id && validBudgetIds.has(item.budget_id) ? item.budget_id : null

    return {
      id: `parsed_${Date.now()}_${index}`,
      date: item.date,
      description: item.description,
      amount: Math.abs(Number(item.amount) || 0),
      type: item.type === 'income' ? 'income' : 'expense',
      payment_method: item.payment_method || 'Bank Transfer',
      budget_id: matchedBudgetId,
      is_potential_duplicate: Boolean(isDuplicate),
      duplicate_reason: duplicateReason,
      // If potential duplicate, uncheck by default; otherwise checked
      selected: !isDuplicate
    }
  })

  return {
    success: true,
    filename,
    total_parsed: items.length,
    items
  }
})
