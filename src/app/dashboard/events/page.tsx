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
  inquiry:    { bg: 'rgba(226, 75, 74, 0.18)',   text: '#ff6b6a' },
  tentative:  { bg: 'rgba(186, 117, 23, 0.18)',  text: '#ffa832' },
  contracted: { bg: 'rgba(24, 95, 165, 0.18)',   text: '#5ba3f5' },
  staffed:    { bg: 'rgba(99, 153, 34, 0.18)',   text: '#7dd44a' },
  complete:   { bg: 'rgba(136, 135, 128, 0.18)', text: '#a0a09a' },
  expired:    { bg: 'rgba(136, 135, 128, 0.18)', text: '#6b7080' },
  cancelled:  { bg: 'rgba(136, 135, 128, 0.18)', text: '#6b7080' },
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
          <h1 className="text-lg font-semibold text-[#c8d0f0] tracking-wide uppercase">Events</h1>
          <p className="text-sm text-[#4a5580] mt-0.5">All HighTone events</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#00fff9] text-[#080812] font-semibold text-sm px-4 py-2 rounded-sm hover:bg-[#00e0e0] transition-colors tracking-wide"
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
              ? 'bg-[#00fff9] text-[#080812]'
              : 'bg-[#131336] text-[#4a5580] hover:bg-[#1a1a3e]'
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
        <div className="flex items-center justify-center h-64 text-sm text-[#4a5580]">
          Loading events...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-[#4a5580]">
          No events found.
        </div>
      ) : (
        <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e4a]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Event</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Location</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Staffing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e4a]">
              {filtered.map((event) => {
                const style = statusColors[event.status] ?? statusColors.complete
                return (
                  <tr
                    key={event.id}
                    onClick={() => router.push(`/dashboard/events/${event.id}`)}
                    className="hover:bg-[#1a1a3e] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#c8d0f0]">{event.title}</p>
                      <p className="text-xs text-[#4a5580]">{event.event_type}</p>
                    </td>
                    <td className="px-5 py-3 text-[#8890b0]">{formatDate(event.event_date)}</td>
                    <td className="px-5 py-3 text-[#8890b0]">{event.location}</td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: style.bg, color: style.text }}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#4a5580] capitalize">{event.staffing_status}</td>
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
