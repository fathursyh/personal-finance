import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// Derived from Nitro's own h3 so it matches the event handlers receive.
type H3Event = Parameters<typeof getHeader>[0]

export interface StoredUser {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface PublicUser {
  id: string
  name: string
  email: string
}

// Stored on disk under .data/ (see nitro.storage in nuxt.config.ts).
export const usersStorage = () => useStorage<StoredUser>('users')
export const sessionsStorage = () => useStorage<{ userId: string }>('sessions')

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

// Emails contain characters that are awkward in file names, so key by hex.
export function userKey(email: string) {
  return Buffer.from(normalizeEmail(email)).toString('hex')
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return timingSafeEqual(expected, actual)
}

export function toPublicUser(user: StoredUser): PublicUser {
  return { id: user.id, name: user.name, email: user.email }
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  await sessionsStorage().setItem(token, { userId })
  return token
}

export function getAuthToken(event: H3Event) {
  const header = getHeader(event, 'authorization') || getHeader(event, 'token')
  if (header) {
    // Supports "Token <token>", "Bearer <token>", or raw "<token>"
    const match = header.match(/^(?:Bearer|Token)\s+(.+)$/i)
    return match && match[1] ? match[1].trim() : header.trim()
  }
  return getCookie(event, 'auth.token') || null
}

export const getBearerToken = getAuthToken

export async function getUserFromEvent(event: H3Event) {
  const token = getAuthToken(event)
  if (!token) return null
  const session = await sessionsStorage().getItem(token)
  if (!session) return null
  const users = usersStorage()
  for (const key of await users.getKeys()) {
    const user = await users.getItem(key)
    if (user?.id === session.userId) return user
  }
  return null
}
