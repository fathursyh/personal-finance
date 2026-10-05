import z from 'zod'

const RegisterBody = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export default defineEventHandler(async (event) => {
  const parsed = RegisterBody.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }
  const { name, email, password } = parsed.data

  const users = usersStorage()
  const key = userKey(email)
  if (await users.hasItem(key)) {
    throw createError({ statusCode: 409, statusMessage: 'Email is already registered' })
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email: normalizeEmail(email),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  }
  await users.setItem(key, user)

  return { user: toPublicUser(user) }
})
