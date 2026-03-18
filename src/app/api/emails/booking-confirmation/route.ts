import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { staffId } = await req.json()

  const { data, error } = await supabase
    .from('event_staff')
    .select(`
      id, role,
      employees (name, email),
      events (title, event_type, event_date, location, contracted_start, contracted_end, notes)
    `)
    .eq('id', staffId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
  }

  const employee = data.employees as { name: string; email: string } | null
  const event = data.events as {
    title: string
    event_type: string
    event_date: string
    location: string
    contracted_start: string | null
    contracted_end: string | null
    notes: string | null
  } | null

  if (!employee || !event) {
    return NextResponse.json({ error: 'Missing employee or event data' }, { status: 400 })
  }

  const eventDate = new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
  }

  const timeStr = event.contracted_start && event.contracted_end
    ? `${formatTime(event.contracted_start)} – ${formatTime(event.contracted_end)}`
    : 'TBD'

  const { error: sendError } = await resend.emails.send({
    from: 'HighTone Entertainment <onboarding@resend.dev>',
    to: employee.email,
    subject: `You're Confirmed — ${event.title} on ${eventDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p>Hi ${employee.name},</p>
        <p>This is your official booking confirmation for the following event. Please save these details for your records.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0; background: #f9f9f9; border-radius: 8px; overflow: hidden;">
          <tr><td style="padding: 10px 16px; font-weight: bold; width: 140px; color: #555;">Event</td><td style="padding: 10px 16px;">${event.title}</td></tr>
          <tr style="background: #f0f0f0;"><td style="padding: 10px 16px; font-weight: bold; color: #555;">Type</td><td style="padding: 10px 16px;">${event.event_type}</td></tr>
          <tr><td style="padding: 10px 16px; font-weight: bold; color: #555;">Date</td><td style="padding: 10px 16px;">${eventDate}</td></tr>
          <tr style="background: #f0f0f0;"><td style="padding: 10px 16px; font-weight: bold; color: #555;">Time</td><td style="padding: 10px 16px;">${timeStr}</td></tr>
          <tr><td style="padding: 10px 16px; font-weight: bold; color: #555;">Location</td><td style="padding: 10px 16px;">${event.location}</td></tr>
          <tr style="background: #f0f0f0;"><td style="padding: 10px 16px; font-weight: bold; color: #555;">Your Role</td><td style="padding: 10px 16px;">${data.role}</td></tr>
        </table>

        ${event.notes ? `<p style="background: #e8f4fd; border-left: 3px solid #185FA5; padding: 12px 16px; border-radius: 4px;"><strong>Event notes:</strong><br/>${event.notes}</p>` : ''}

        <p>If you have any questions or need to make changes, please reply to this email as soon as possible.</p>
        <p>We look forward to working with you!</p>
        <p>Thanks,<br/><strong>HighTone Entertainment</strong></p>
      </div>
    `,
  })

  if (sendError) {
    return NextResponse.json({ error: sendError.message }, { status: 500 })
  }

  // Stamp confirmed_at
  await supabase
    .from('event_staff')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', staffId)

  return NextResponse.json({ success: true })
}
