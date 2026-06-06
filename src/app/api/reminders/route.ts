export async function GET() {
  return Response.json({
    message: 'Deadline reminder check complete',
    note: 'Connect Resend API key and configure Vercel Cron to enable email reminders',
  })
}
