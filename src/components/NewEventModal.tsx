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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">New Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={form.client_id}
              onChange={(e) => set('client_id', e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Smith Wedding"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Event type + Status (2-col) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event type <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={form.event_type}
                onChange={(e) => set('event_type', e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={form.event_date}
                onChange={(e) => set('event_date', e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="Venue name or address"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contracted start + end (2-col) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contracted start <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={form.contracted_start}
                onChange={(e) => set('contracted_start', e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contracted end <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="time"
                value={form.contracted_end}
                onChange={(e) => set('contracted_end', e.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any initial notes..."
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
