'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { supabase } from '@/lib/supabase'
import NewEventModal from '@/components/NewEventModal'

const statusColors: Record<string, string> = {
  inquiry: '#E24B4A',
  tentative: '#BA7517',
  contracted: '#185FA5',
  staffed: '#639922',
  complete: '#888780',
  expired: '#B4B2A9',
  cancelled: '#B4B2A9',
}

type Event = {
  id: string
  title: string
  start: string
  end?: string
  backgroundColor: string
  borderColor: string
  extendedProps: {
    status: string
    staffing_status: string
    location: string
  }
}

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let active = true

    supabase
      .from('events')
      .select('id, title, event_date, end_date, status, staffing_status, location')
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error('Error fetching events:', error); return }

        setEvents(data.map((event) => ({
          id: event.id,
          title: event.title,
          start: event.event_date,
          end: event.end_date ?? undefined,
          backgroundColor: statusColors[event.status] ?? '#888780',
          borderColor: statusColors[event.status] ?? '#888780',
          extendedProps: {
            status: event.status,
            staffing_status: event.staffing_status,
            location: event.location,
          },
        })))
        setLoading(false)
      })

    return () => { active = false }
  }, [refreshTick])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-400 mt-0.5">All HighTone events</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3">
            {Object.entries(statusColors).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-500 capitalize">{status}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            + New Event
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96 text-sm text-gray-400">
          Loading events...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            height="auto"
            eventClick={(info) => {
              router.push(`/dashboard/events/${info.event.id}`)
            }}
          />
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
