export default defineEventHandler(async (event) => {
  const token = getAuthToken(event)
  if (token) await sessionsStorage().removeItem(token)
  return { status: 'OK' }
})
