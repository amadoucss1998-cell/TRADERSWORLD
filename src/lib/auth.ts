import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'scholarpath-dev-secret-change-in-production'
)
const COOKIE = 'sp_token'
const EXPIRES_IN = '7d'

export interface TokenPayload extends JWTPayload {
  userId: string
  email: string
  fullName: string
}

export async function signToken(payload: Omit<TokenPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as TokenPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verifyToken(token)
}

export function setTokenCookie(token: string): { name: string; value: string; options: object } {
  return {
    name: COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  }
}

export function clearTokenCookie(): { name: string; value: string; options: object } {
  return {
    name: COOKIE,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    },
  }
}
