/**
 * User persistence layer.
 * Uses Supabase Postgres when configured, falls back to an in-process
 * Map for development/demo (resets on server restart).
 */
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  full_name: string
  password_hash: string
  created_at: string
}

// ── In-memory fallback ──────────────────────────────────────────────────────
const memStore = new Map<string, User>()

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return url.startsWith('https://') && !url.includes('placeholder')
}

async function getSupabase() {
  if (!isSupabaseConfigured()) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<User | null> {
  const sb = await getSupabase()
  if (sb) {
    const { data } = await sb.from('users').select('*').eq('email', email).single()
    return data ?? null
  }
  return memStore.get(email.toLowerCase()) ?? null
}

export async function findUserById(id: string): Promise<User | null> {
  const sb = await getSupabase()
  if (sb) {
    const { data } = await sb.from('users').select('*').eq('id', id).single()
    return data ?? null
  }
  for (const u of memStore.values()) {
    if (u.id === id) return u
  }
  return null
}

export async function createUser(email: string, fullName: string, password: string): Promise<User> {
  const existing = await findUserByEmail(email)
  if (existing) throw new Error('Email already registered')

  const password_hash = await bcrypt.hash(password, 10)
  const user: User = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    full_name: fullName,
    password_hash,
    created_at: new Date().toISOString(),
  }

  const sb = await getSupabase()
  if (sb) {
    const { error } = await sb.from('users').insert(user)
    if (error) throw new Error(error.message)
  } else {
    memStore.set(user.email, user)
  }

  return user
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash)
}
