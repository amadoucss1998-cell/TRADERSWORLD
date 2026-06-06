import { NextRequest } from 'next/server'
import { createUser } from '@/lib/users'
import { signToken, setTokenCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password, full_name } = await req.json().catch(() => ({}))

  if (!email || !password || !full_name) {
    return Response.json({ error: 'Name, email, and password are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  try {
    const user = await createUser(email, full_name, password)
    const token = await signToken({ userId: user.id, email: user.email, fullName: user.full_name })
    const { name, value, options } = setTokenCookie(token)

    return Response.json(
      { user: { id: user.id, email: user.email, full_name: user.full_name } },
      { headers: { 'Set-Cookie': `${name}=${value}; Path=${(options as Record<string, unknown>).path}; Max-Age=${(options as Record<string, unknown>).maxAge}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` } }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed.'
    return Response.json({ error: message }, { status: 409 })
  }
}
