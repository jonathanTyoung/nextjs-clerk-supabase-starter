'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Employee = {
  id: string
  name: string
  role: string
}

type EventStaff = {
  id: string
  role: string
  status: string
  confirmed_at: string | null
  employees: {
    id: string
    name: string
  } | null
}

type Props = {
  eventId: string
}

type SendingPanel = {
  staffId: string
  type: 'availability' | 'confirmation'
}

const ROLES = ['DJ', 'Photo Booth', 'A/V Tech', 'Other']

const statusStyles: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#F3F4F6', text: '#6B7280' },
  requested: { bg: '#FEF3C7', text: '#BA7517' },
  confirmed: { bg: '#DCFCE7', text: '#639922' },
  released:  { bg: '#FEE2E2', text: '#E24B4A' },
}

export default function StaffSection({ eventId }: Props) {
  const [staff, setStaff] = useState<EventStaff[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const [sendingPanel, setSendingPanel] = useState<SendingPanel | null>(null)
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sentConfirm, setSentConfirm] = useState<string | null>(null)

  // Add form state
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([
      supabase
        .from('event_staff')
        .select('id, role, status, confirmed_at, employees (id, name)')
        .eq('event_id', eventId)
        .order('created_at'),
      supabase
        .from('employees')
        .select('id, name, role')
        .order('name'),
    ]).then(([staffRes, empRes]) => {
      if (!active) return
      if (staffRes.data) setStaff(staffRes.data as EventStaff[])
      if (empRes.data) setEmployees(empRes.data)
    })

    return () => { active = false }
  }, [eventId, refreshTick])

  function handleEmployeeChange(employeeId: string) {
    setSelectedEmployee(employeeId)
    const emp = employees.find((e) => e.id === employeeId)
    if (emp) setSelectedRole(emp.role)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setAddError(null)

    const { error } = await supabase.from('event_staff').insert({
      event_id: eventId,
      employee_id: selectedEmployee,
      role: selectedRole,
      status: 'pending',
    })

    if (error) { setAddError(error.message); setSubmitting(false); return }

    setShowAdd(false)
    setSelectedEmployee('')
    setSelectedRole('')
    setRefreshTick((t) => t + 1)
    setSubmitting(false)
  }

  async function handleRemove(staffId: string) {
    await supabase.from('event_staff').delete().eq('id', staffId)
    setRefreshTick((t) => t + 1)
  }

  async function handleStatusChange(staffId: string, status: string) {
    await supabase.from('event_staff').update({ status }).eq('id', staffId)
    setRefreshTick((t) => t + 1)
  }

  function openPanel(staffId: string, type: 'availability' | 'confirmation') {
    setSendingPanel({ staffId, type })
    setNotes('')
    setSendError(null)
    setSentConfirm(null)
  }

  function closePanel() {
    setSendingPanel(null)
    setNotes('')
    setSendError(null)
  }

  async function handleSendEmail() {
    if (!sendingPanel) return
    setSending(true)
    setSendError(null)

    const endpoint = sendingPanel.type === 'availability'
      ? '/api/emails/availability-request'
      : '/api/emails/booking-confirmation'

    const body = sendingPanel.type === 'availability'
      ? { staffId: sendingPanel.staffId, notes }
      : { staffId: sendingPanel.staffId }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const json = await res.json()

    if (!res.ok) {
      setSendError(json.error ?? 'Failed to send email')
      setSending(false)
      return
    }

    setSentConfirm(
      sendingPanel.type === 'availability'
        ? 'Availability request sent'
        : 'Booking confirmation sent'
    )
    setSending(false)
    setSendingPanel(null)
    setRefreshTick((t) => t + 1)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-900">Staff</p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Employee</label>
            <select
              required
              value={selectedEmployee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Role for this event</label>
            <select
              required
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {addError && <p className="text-xs text-red-500">{addError}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add to event'}
            </button>
          </div>
        </form>
      )}

      {/* Sent confirmation toast */}
      {sentConfirm && (
        <div className="mb-3 px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
          ✓ {sentConfirm}
        </div>
      )}

      {/* Staff list */}
      {staff.length === 0 ? (
        <p className="text-sm text-gray-400">No staff assigned yet.</p>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => {
            const style = statusStyles[s.status] ?? statusStyles.pending
            const isPanelOpen = sendingPanel?.staffId === s.id

            return (
              <div key={s.id} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                {/* Staff row */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.employees?.name ?? '—'}</p>
                    <p className="text-xs text-gray-500">{s.role}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={s.status}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      className="text-xs font-medium px-2 py-0.5 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      <option value="pending">Pending</option>
                      <option value="requested">Requested</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="released">Released</option>
                    </select>
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Email action buttons */}
                <div className="flex gap-3 mt-2">
                  {s.status === 'pending' && (
                    <button
                      onClick={() => isPanelOpen && sendingPanel?.type === 'availability' ? closePanel() : openPanel(s.id, 'availability')}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Send availability request
                    </button>
                  )}
                  {s.status === 'confirmed' && (
                    <button
                      onClick={() => isPanelOpen && sendingPanel?.type === 'confirmation' ? closePanel() : openPanel(s.id, 'confirmation')}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Send booking confirmation
                    </button>
                  )}
                  {s.status === 'requested' && (
                    <p className="text-xs text-gray-400">Availability request sent — awaiting response</p>
                  )}
                </div>

                {/* Inline send panel */}
                {isPanelOpen && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                    {sendingPanel?.type === 'availability' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Additional notes <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Anything specific Kelcie wants to mention about this gig..."
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    )}
                    {sendingPanel?.type === 'confirmation' && (
                      <p className="text-xs text-gray-600">
                        This will send a booking confirmation email with all current event details to {s.employees?.name}.
                      </p>
                    )}
                    {sendError && <p className="text-xs text-red-500">{sendError}</p>}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={closePanel}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendEmail}
                        disabled={sending}
                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {sending ? 'Sending...' : 'Send email'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
