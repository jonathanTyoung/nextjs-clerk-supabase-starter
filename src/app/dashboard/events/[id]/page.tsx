'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StaffSection from '@/components/StaffSection'
import ContractSection from '@/components/ContractSection'
import PayrollSection from '@/components/PayrollSection'

const statusColors: Record<string, { bg: string; text: string }> = {
  inquiry:    { bg: '#FEE2E2', text: '#E24B4A' },
  tentative:  { bg: '#FEF3C7', text: '#BA7517' },
  contracted: { bg: '#DBEAFE', text: '#185FA5' },
  staffed:    { bg: '#DCFCE7', text: '#639922' },
  complete:   { bg: '#F3F4F6', text: '#888780' },
  expired:    { bg: '#F3F4F6', text: '#B4B2A9' },
  cancelled:  { bg: '#F3F4F6', text: '#B4B2A9' },
}

type Event = {
  id: string
  title: string
  event_type: string
  status: string
  staffing_status: string
  timeline_status: string
  event_date: string
  end_date: string | null
  location: string
  contracted_start: string | null
  contracted_end: string | null
  notes: string | null
  clients: {
    id: string
    name: string
    email: string
    phone: string | null
  } | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('events')
      .select(`
        id, title, event_type, status, staffing_status, timeline_status,
        event_date, end_date, location, contracted_start, contracted_end, notes,
        clients (id, name, email, phone)
      `)
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        setEvent(data as Event)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-gray-400">
        Loading event...
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-gray-400">
        Event not found.
      </div>
    )
  }

  const statusStyle = statusColors[event.status] ?? { bg: '#F3F4F6', text: '#888780' }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Top nav */}
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6 flex items-center gap-1"
      >
        ← Back to Calendar
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-gray-900">{event.title}</h1>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
            >
              {event.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {event.event_type} &middot; {formatDate(event.event_date)}
            {event.end_date && event.end_date !== event.event_date && (
              <> – {formatDate(event.end_date)}</>
            )}
            {' '}&middot; {event.location}
          </p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/events/${event.id}/edit`)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
      </div>

      {/* Details card */}
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">
        {/* Client */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Client</p>
          {event.clients ? (
            <div>
              <p className="text-sm font-medium text-gray-900">{event.clients.name}</p>
              <p className="text-sm text-gray-500">{event.clients.email}</p>
              {event.clients.phone && (
                <p className="text-sm text-gray-500">{event.clients.phone}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No client linked</p>
          )}
        </div>

        {/* Times */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Contracted times</p>
          {event.contracted_start && event.contracted_end ? (
            <p className="text-sm text-gray-900">
              {formatTime(event.contracted_start)} – {formatTime(event.contracted_end)}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Not set</p>
          )}
        </div>

        {/* Statuses */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Statuses</p>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Staffing</p>
              <p className="text-sm text-gray-900 capitalize">{event.staffing_status}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Timeline</p>
              <p className="text-sm text-gray-900 capitalize">{event.timeline_status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Notes</p>
          {event.notes ? (
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{event.notes}</p>
          ) : (
            <p className="text-sm text-gray-400">No notes</p>
          )}
        </div>
      </div>

      {/* Staff */}
      <div className="mt-6">
        <StaffSection eventId={event.id} />
      </div>

      {/* Contract + Payroll + Timeline stub */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <ContractSection eventId={event.id} />
        <PayrollSection eventId={event.id} />
        <div className="bg-white border border-gray-100 rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-gray-900 mb-1">Timeline</p>
          <p className="text-xs text-gray-400">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
