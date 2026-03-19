'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string
  name: string
}

type Props = {
  onClose: () => void
  onCreated: () => void
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

const STATUS_OPTIONS = [
  'inquiry',
  'tentative',
  'contracted',
  'staffed',
  'complete',
  'cancelled',
  'expired',
]

export default function NewEventModal({ onClose, onCreated }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    client_id: '',
    title: '',
    event_type: '',
    status: 'inquiry',
    event_date: '',
    end_date: '',
    location: '',
    contracted_start: '',
    contracted_end: '',
    notes: '',
  })

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setClients(data)
      })
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: Record<string, unknown> = {
      title: form.title,
      event_type: form.event_type,
      status: form.status,
      event_date: form.event_date,
      location: form.location,
    }

    if (form.client_id) payload.client_id = form.client_id
    if (form.end_date) payload.end_date = form.end_date
    if (form.contracted_start) payload.contracted_start = form.contracted_start
    if (form.contracted_end) payload.contracted_end = form.contracted_end
    if (form.notes) payload.notes = form.notes

    const { error: insertError } = await supabase.from('events').insert(payload)

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    onCreated()
    onClose()
  }

  const inputClass = "w-full border border-[#1e1e4a] rounded-sm px-3 py-2 text-sm text-[#c8d0f0] bg-[#080812] placeholder:text-[#4a5580] focus:outline-none focus:ring-2 focus:ring-[#00fff9]/50 focus:border-[#00fff9]"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e4a]">
          <h2 className="text-base font-semibold text-[#c8d0f0] tracking-wide uppercase">New Event</h2>
          <button
            onClick={onClose}
            className="text-[#4a5580] hover:text-[#00fff9] transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Client <span className="text-[#4a5580] font-normal normal-case">(optional)</span>
            </label>
            <select
              value={form.client_id}
              onChange={(e) => set('client_id', e.target.value)}
              className={inputClass}
            >
              <option value="">— No client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Event title <span className="text-[#ff2d78]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Smith Wedding"
              className={inputClass}
            />
          </div>

          {/* Event type + Status (2-col) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
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
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event date + End date (2-col) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
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
              <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
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
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Location <span className="text-[#ff2d78]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Venue name or address"
              className={inputClass}
            />
          </div>

          {/* Contracted start + end (2-col) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
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
              <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
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
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Notes <span className="text-[#4a5580] font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any initial notes..."
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-sm text-[#ff2d78]">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#4a5580] hover:text-[#c8d0f0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-[#00fff9] text-[#080812] font-semibold rounded-sm hover:bg-[#00e0e0] disabled:opacity-50 transition-colors tracking-wide"
            >
              {submitting ? 'Creating...' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
