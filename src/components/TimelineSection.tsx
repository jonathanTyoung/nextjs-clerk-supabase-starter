'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type TimelineSubmission = {
  id: string
  submitted_by: string
  content: string
  flag_overtime: boolean
  flag_addons: boolean
  submitted_at: string
}

type EventTimes = {
  contracted_start: string | null
  contracted_end: string | null
  actual_start: string | null
  actual_end: string | null
  timeline_status: string
}

type Props = {
  eventId: string
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function timesMatch(contracted: string | null, actual: string | null): boolean | null {
  if (!contracted || !actual) return null
  return contracted.slice(0, 5) === actual.slice(0, 5)
}

export default function TimelineSection({ eventId }: Props) {
  const [submission, setSubmission] = useState<TimelineSubmission | null>(null)
  const [eventTimes, setEventTimes] = useState<EventTimes | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const [form, setForm] = useState({
    submitted_by: '',
    content: '',
    actual_start: '',
    actual_end: '',
    flag_overtime: false,
    flag_addons: false,
  })

  useEffect(() => {
    let active = true

    Promise.all([
      supabase
        .from('timeline_submissions')
        .select('id, submitted_by, content, flag_overtime, flag_addons, submitted_at')
        .eq('event_id', eventId)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('events')
        .select('contracted_start, contracted_end, actual_start, actual_end, timeline_status')
        .eq('id', eventId)
        .single(),
    ]).then(([subRes, evtRes]) => {
      if (!active) return
      setSubmission(subRes.data ?? null)
      setEventTimes(evtRes.data ?? null)
      setLoading(false)
    })

    return () => { active = false }
  }, [eventId, refreshTick])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('timeline_submissions')
      .insert({
        event_id: eventId,
        submitted_by: form.submitted_by,
        content: form.content,
        flag_overtime: form.flag_overtime,
        flag_addons: form.flag_addons,
      })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    const updatePayload: Record<string, unknown> = { timeline_status: 'received' }
    if (form.actual_start) updatePayload.actual_start = form.actual_start
    if (form.actual_end) updatePayload.actual_end = form.actual_end

    await supabase.from('events').update(updatePayload).eq('id', eventId)

    setShowForm(false)
    setForm({ submitted_by: '', content: '', actual_start: '', actual_end: '', flag_overtime: false, flag_addons: false })
    setRefreshTick((t) => t + 1)
    setSubmitting(false)
  }

  const inputClass = "w-full border border-[#1e1e4a] rounded-sm px-3 py-2 text-sm text-[#c8d0f0] bg-[#080812] placeholder:text-[#4a5580] focus:outline-none focus:ring-2 focus:ring-[#00fff9]/50 focus:border-[#00fff9]"

  if (loading) {
    return (
      <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm px-5 py-4">
        <p className="text-xs text-[#4a5580]">Loading...</p>
      </div>
    )
  }

  const startMatch = timesMatch(eventTimes?.contracted_start ?? null, eventTimes?.actual_start ?? null)
  const endMatch = timesMatch(eventTimes?.contracted_end ?? null, eventTimes?.actual_end ?? null)
  const hasMismatch = startMatch === false || endMatch === false

  return (
    <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#c8d0f0] uppercase tracking-wide">Timeline</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm text-[#00fff9] hover:text-[#00e0e0] transition-colors"
        >
          {showForm ? 'Cancel' : submission ? 'Update' : '+ Record'}
        </button>
      </div>

      {/* Status */}
      <div className="mb-3">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={
            eventTimes?.timeline_status === 'received'
              ? { backgroundColor: 'rgba(99, 153, 34, 0.18)', color: '#7dd44a' }
              : { backgroundColor: 'rgba(107, 114, 128, 0.18)', color: '#8890b0' }
          }
        >
          {(eventTimes?.timeline_status ?? 'not_received').replace('_', ' ')}
        </span>
      </div>

      {/* Record / update form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-[#080812] border border-[#1e1e4a] rounded-sm space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Submitted by <span className="text-[#ff2d78]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.submitted_by}
              onChange={(e) => setForm((f) => ({ ...f, submitted_by: e.target.value }))}
              placeholder="Coordinator name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Timeline content <span className="text-[#ff2d78]">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Paste or summarize the coordinator's timeline..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
                Actual start
              </label>
              {eventTimes?.contracted_start && (
                <p className="text-xs text-[#4a5580] mb-1">Contracted: {formatTime(eventTimes.contracted_start)}</p>
              )}
              <input
                type="time"
                value={form.actual_start}
                onChange={(e) => setForm((f) => ({ ...f, actual_start: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
                Actual end
              </label>
              {eventTimes?.contracted_end && (
                <p className="text-xs text-[#4a5580] mb-1">Contracted: {formatTime(eventTimes.contracted_end)}</p>
              )}
              <input
                type="time"
                value={form.actual_end}
                onChange={(e) => setForm((f) => ({ ...f, actual_end: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-[#8890b0] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.flag_overtime}
                onChange={(e) => setForm((f) => ({ ...f, flag_overtime: e.target.checked }))}
                className="accent-[#ff2d78]"
              />
              Flag: Overtime
            </label>
            <label className="flex items-center gap-2 text-xs text-[#8890b0] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.flag_addons}
                onChange={(e) => setForm((f) => ({ ...f, flag_addons: e.target.checked }))}
                className="accent-[#ffa832]"
              />
              Flag: Add-ons needed
            </label>
          </div>

          {error && <p className="text-xs text-[#ff2d78]">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-sm bg-[#00fff9] text-[#080812] font-semibold rounded-sm hover:bg-[#00e0e0] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving...' : 'Save timeline'}
            </button>
          </div>
        </form>
      )}

      {/* Received timeline display */}
      {!showForm && submission && (
        <div className="space-y-3">
          {/* Time comparison */}
          {(eventTimes?.contracted_start || eventTimes?.actual_start) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[#4a5580] mb-1 uppercase tracking-wide">Contracted</p>
                <p className="text-[#8890b0]">
                  {eventTimes?.contracted_start ? formatTime(eventTimes.contracted_start) : '—'}
                  {' – '}
                  {eventTimes?.contracted_end ? formatTime(eventTimes.contracted_end) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[#4a5580] mb-1 uppercase tracking-wide">Actual</p>
                <p className={hasMismatch ? 'text-[#ff2d78] font-medium' : 'text-[#8890b0]'}>
                  {eventTimes?.actual_start ? formatTime(eventTimes.actual_start) : '—'}
                  {' – '}
                  {eventTimes?.actual_end ? formatTime(eventTimes.actual_end) : '—'}
                  {hasMismatch && <span className="ml-1">⚠</span>}
                </p>
              </div>
            </div>
          )}

          {/* Flags */}
          {(submission.flag_overtime || submission.flag_addons) && (
            <div className="flex gap-2">
              {submission.flag_overtime && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(226, 75, 74, 0.18)', color: '#ff6b6a' }}>
                  Overtime
                </span>
              )}
              {submission.flag_addons && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(186, 117, 23, 0.18)', color: '#ffa832' }}>
                  Add-ons needed
                </span>
              )}
            </div>
          )}

          {/* Content */}
          <p className="text-xs text-[#8890b0] whitespace-pre-wrap leading-relaxed">{submission.content}</p>

          <p className="text-xs text-[#4a5580]">
            From {submission.submitted_by} · {new Date(submission.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      )}

      {!showForm && !submission && (
        <p className="text-sm text-[#4a5580]">No timeline received yet.</p>
      )}
    </div>
  )
}
