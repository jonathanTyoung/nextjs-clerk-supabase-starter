'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NewEventModal from '@/components/NewEventModal'

type Event = {
  id: string
  title: string
  event_type: string
  status: string
  staffing_status: string
  event_date: string
  location: string
}

const statusColors: Record<string, { bg: string; text: string }> = {
  inquiry:    { bg: '#FEE2E2', text: '#E24B4A' },
  tentative:  { bg: '#FEF3C7', text: '#BA7517' },
  contracted: { bg: '#DBEAFE', text: '#185FA5' },
  staffed:    { bg: '#DCFCE7', text: '#639922' },
  complete:   { bg: '#F3F4F6', text: '#888780' },
  expired:    { bg: '#F3F4F6', text: '#B4B2A9' },
  cancelled:  { bg: '#F3F4F6', text: '#B4B2A9' },
}

const ALL_STATUSES = ['inquiry', 'tentative', 'contracted', 'staffed', 'complete', 'cancelled', 'expired']

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let active = true

    supabase
      .from('events')
      .select('id, title, event_type, status, staffing_status, event_date, location')
      .order('event_date', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error(error); return }
        setEvents(data ?? [])
        setLoading(false)
      })

    return () => { active = false }
  }, [refreshTick])

  const filtered = statusFilter
    ? events.filter((e) => e.status === statusFilter)
    : events

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Events</h1>
          <p className="text-sm text-gray-400 mt-0.5">All HighTone events</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Event
        </button>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            statusFilter === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {ALL_STATUSES.map((s) => {
          const style = statusColors[s]
          const active = statusFilter === s
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(active ? null : s)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-opacity capitalize"
              style={{
                backgroundColor: style.bg,
                color: style.text,
                opacity: active ? 1 : 0.7,
                outline: active ? `2px solid ${style.text}` : 'none',
                outlineOffset: '1px',
              }}
            >
              {s}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          Loading events...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          No events found.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Event</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Location</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Staffing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((event) => {
                const style = statusColors[event.status] ?? statusColors.complete
                return (
                  <tr
                    key={event.id}
                    onClick={() => router.push(`/dashboard/events/${event.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-400">{event.event_type}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(event.event_date)}</td>
                    <td className="px-5 py-3 text-gray-600">{event.location}</td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: style.bg, color: style.text }}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 capitalize">{event.staffing_status}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NewEventModal
          onClose={() => setShowModal(false)}
          onCreated={() => setRefreshTick((t) => t + 1)}
        />
      )}
    </div>
  )
}
