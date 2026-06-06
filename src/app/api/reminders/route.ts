import { getSession } from '@/lib/auth'

export async function GET() {
  // In production, this is called by Vercel Cron + Resend to send deadline reminder emails.
  // Auth check is skipped for cron compatibility; use a cron secret header in production.
  const session = await getSession().catch(() => null)
  void session // session used for future per-user logic

  return Response.json({
    message: 'Deadline reminder check complete',
    note: 'Connect Resend API key and configure Vercel Cron to enable email reminders',
  })
}
