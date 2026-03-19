'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string
  name: string
}

const EVENT_TYPES = [
  'Wedding',
  'Sweet 16',
  'Quinceañera',
  'Bar Mitzvah',
  'Bat Mitzvah',
  'Birthday',
  'Corporate',
  'Prom / School Dance',
  'Other',
]

const STATUS_OPTIONS = ['inquiry', 'tentative', 'contracted', 'staffed', 'complete', 'cancelled', 'expired']
const STAFFING_STATUS_OPTIONS = ['pending', 'requested', 'confirmed', 'released']
const TIMELINE_STATUS_OPTIONS = ['not_received', 'pending', 'received', 'flagged']

function labelFor(value: string) {
  return value.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const inputClass = "w-full border border-[#1e1e4a] rounded-sm px-3 py-2 text-sm text-[#c8d0f0] bg-[#080812] placeholder:text-[#4a5580] focus:outline-none focus:ring-2 focus:ring-[#00fff9]/50 focus:border-[#00fff9]"
const labelClass = "block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-2"

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState({
    client_id: '',
    title: '',
    event_type: '',
    status: 'inquiry',
    staffing_status: 'pending',
    timeline_status: 'not_received',
    event_date: '',
    end_date: '',
    location: '',
    contracted_start: '',
    contracted_end: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('id, name').order('name'),
      supabase
        .from('events')
        .select('id, client_id, title, event_type, status, staffing_status, timeline_status, event_date, end_date, location, contracted_start, contracted_end, notes')
        .eq('id', id)
        .single(),
    ]).then(([clientsRes, eventRes]) => {
      if (clientsRes.data) setClients(clientsRes.data)

      if (eventRes.error || !eventRes.data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const e = eventRes.data
      setForm({
        client_id: e.client_id ?? '',
        title: e.title,
        event_type: e.event_type,
        status: e.status,
        staffing_status: e.staffing_status,
        timeline_status: e.timeline_status,
        event_date: e.event_date,
        end_date: e.end_date ?? '',
        location: e.location,
        contracted_start: e.contracted_start ?? '',
        contracted_end: e.contracted_end ?? '',
        notes: e.notes ?? '',
      })
      setLoading(false)
    })
  }, [id])

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: Record<string, unknown> = {
      title: form.title,
      event_type: form.event_type,
      status: form.status,
      staffing_status: form.staffing_status,
      timeline_status: form.timeline_status,
      event_date: form.event_date,
      location: form.location,
      client_id: form.client_id || null,
      end_date: form.end_date || null,
      contracted_start: form.contracted_start || null,
      contracted_end: form.contracted_end || null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    router.push(`/dashboard/events/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-[#4a5580]">
        Loading event...
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-[#4a5580]">
        Event not found.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        onClick={() => router.push(`/dashboard/events/${id}`)}
        className="text-sm text-[#00fff9] hover:text-[#00e0e0] transition-colors mb-6 flex items-center gap-1"
      >
        ← Back to event
      </button>

      <h1 className="text-xl font-semibold text-[#c8d0f0] mb-6">Edit Event</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm divide-y divide-[#1e1e4a]">

          {/* Client */}
          <div className="px-5 py-4">
            <label className={labelClass}>Client</label>
            <select
              value={form.client_id}
              onChange={(e) => set('client_id', e.target.value)}
              className={inputClass}
            >
              <option value="">— No client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="px-5 py-4">
            <label className={labelClass}>
              Event title <span className="text-[#ff2d78]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Event type + Status */}
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Event type <span className="text-[#ff2d78]">*</span>
              </label>
              <select
                required
                value={form.event_type}
                onChange={(e) => set('event_type', e.target.value)}
                className={inputClass}
              >
                <option value="">Select type</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{labelFor(s)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Staffing status + Timeline status */}
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Staffing status</label>
              <select
                value={form.staffing_status}
                onChange={(e) => set('staffing_status', e.target.value)}
                className={inputClass}
              >
                {STAFFING_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{labelFor(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Timeline status</label>
              <select
                value={form.timeline_status}
                onChange={(e) => set('timeline_status', e.target.value)}
                className={inputClass}
              >
                {TIMELINE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{labelFor(s)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Event date + End date */}
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Event date <span className="text-[#ff2d78]">*</span>
              </label>
              <input
                type="date"
                required
                value={form.event_date}
                onChange={(e) => set('event_date', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                End date <span className="text-[#4a5580] font-normal normal-case">(optional)</span>
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Location */}
          <div className="px-5 py-4">
            <label className={labelClass}>
              Location <span className="text-[#ff2d78]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Contracted start + end */}
          <div className="px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Contracted start <span className="text-[#4a5580] font-normal normal-case">(optional)</span>
              </label>
              <input
                type="time"
                value={form.contracted_start}
                onChange={(e) => set('contracted_start', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Contracted end <span className="text-[#4a5580] font-normal normal-case">(optional)</span>
              </label>
              <input
                type="time"
                value={form.contracted_end}
                onChange={(e) => set('contracted_end', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="px-5 py-4">
            <label className={labelClass}>
              Notes <span className="text-[#4a5580] font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-[#ff2d78]">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/events/${id}`)}
            className="px-4 py-2 text-sm text-[#8890b0] hover:text-[#c8d0f0] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm bg-[#00fff9] text-[#080812] font-semibold rounded-sm hover:bg-[#00e0e0] disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
