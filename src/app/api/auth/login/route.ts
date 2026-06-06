import { NextRequest } from 'next/server'
import { findUserByEmail, verifyPassword } from '@/lib/users'
import { signToken, setTokenCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const user = await findUserByEmail(email)
  if (!user || !(await verifyPassword(user, password))) {
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const token = await signToken({ userId: user.id, email: user.email, fullName: user.full_name })
  const { name, value, options } = setTokenCookie(token)

  return Response.json(
    { user: { id: user.id, email: user.email, full_name: user.full_name } },
    { headers: { 'Set-Cookie': `${name}=${value}; Path=${(options as Record<string, unknown>).path}; Max-Age=${(options as Record<string, unknown>).maxAge}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` } }
  )
}
