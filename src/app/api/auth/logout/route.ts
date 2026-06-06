import { clearTokenCookie } from '@/lib/auth'

export async function POST() {
  const { name, value, options } = clearTokenCookie()
  return Response.json(
    { success: true },
    { headers: { 'Set-Cookie': `${name}=${value}; Path=${(options as Record<string, unknown>).path}; Max-Age=0; HttpOnly; SameSite=Lax` } }
  )
}
