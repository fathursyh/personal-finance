import z from 'zod'

const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const parsed = LoginBody.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }
  const { email, password } = parsed.data

  const user = await usersStorage().getItem(userKey(email))
  // Same error for unknown email and wrong password to avoid user enumeration.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  return { token: await createSession(user.id) }
})
