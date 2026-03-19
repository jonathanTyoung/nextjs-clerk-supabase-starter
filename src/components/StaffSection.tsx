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
  pending:   { bg: 'rgba(107, 114, 128, 0.18)', text: '#8890b0' },
  requested: { bg: 'rgba(186, 117, 23, 0.18)',  text: '#ffa832' },
  confirmed: { bg: 'rgba(99, 153, 34, 0.18)',   text: '#7dd44a' },
  released:  { bg: 'rgba(226, 75, 74, 0.18)',   text: '#ff6b6a' },
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

  const inputClass = "w-full border border-[#1e1e4a] rounded-sm px-3 py-2 text-sm text-[#c8d0f0] bg-[#080812] focus:outline-none focus:ring-2 focus:ring-[#00fff9]/50 focus:border-[#00fff9]"

  return (
    <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm px-5 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#c8d0f0] uppercase tracking-wide">Staff</p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-sm text-[#00fff9] hover:text-[#00e0e0] transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-[#080812] border border-[#1e1e4a] rounded-sm space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">Employee</label>
            <select
              required
              value={selectedEmployee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">Role for this event</label>
            <select
              required
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className={inputClass}
            >
              <option value="">Select role</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          {addError && <p className="text-xs text-[#ff2d78]">{addError}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-sm bg-[#00fff9] text-[#080812] font-semibold rounded-sm hover:bg-[#00e0e0] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add to event'}
            </button>
          </div>
        </form>
      )}

      {/* Sent confirmation toast */}
      {sentConfirm && (
        <div className="mb-3 px-3 py-2 bg-[rgba(99,153,34,0.15)] border border-[rgba(99,153,34,0.3)] rounded-sm text-xs text-[#7dd44a]">
          ✓ {sentConfirm}
        </div>
      )}

      {/* Staff list */}
      {staff.length === 0 ? (
        <p className="text-sm text-[#4a5580]">No staff assigned yet.</p>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => {
            const style = statusStyles[s.status] ?? statusStyles.pending
            const isPanelOpen = sendingPanel?.staffId === s.id

            return (
              <div key={s.id} className="border-b border-[#1e1e4a] last:border-0 pb-3 last:pb-0">
                {/* Staff row */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#c8d0f0]">{s.employees?.name ?? '—'}</p>
                    <p className="text-xs text-[#4a5580]">{s.role}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={s.status}
                      onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      className="text-xs font-medium px-2 py-0.5 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[#00fff9]/50"
                      style={{ backgroundColor: style.bg, color: style.text }}
                    >
                      <option value="pending">Pending</option>
                      <option value="requested">Requested</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="released">Released</option>
                    </select>
                    <button
                      onClick={() => handleRemove(s.id)}
                      className="text-xs text-[#4a5580] hover:text-[#ff2d78] transition-colors"
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
                      className="text-xs text-[#00fff9] hover:text-[#00e0e0] transition-colors"
                    >
                      Send availability request
                    </button>
                  )}
                  {s.status === 'confirmed' && (
                    <button
                      onClick={() => isPanelOpen && sendingPanel?.type === 'confirmation' ? closePanel() : openPanel(s.id, 'confirmation')}
                      className="text-xs text-[#00fff9] hover:text-[#00e0e0] transition-colors"
                    >
                      Send booking confirmation
                    </button>
                  )}
                  {s.status === 'requested' && (
                    <p className="text-xs text-[#4a5580]">Availability request sent — awaiting response</p>
                  )}
                </div>

                {/* Inline send panel */}
                {isPanelOpen && (
                  <div className="mt-3 p-3 bg-[#080812] border border-[#1e1e4a] rounded-sm space-y-3">
                    {sendingPanel?.type === 'availability' && (
                      <div>
                        <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
                          Additional notes <span className="text-[#4a5580] font-normal normal-case">(optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Anything specific to mention about this gig..."
                          className="w-full border border-[#1e1e4a] rounded-sm px-3 py-2 text-xs text-[#c8d0f0] bg-[#0d0d24] placeholder:text-[#4a5580] focus:outline-none focus:ring-2 focus:ring-[#00fff9]/50 focus:border-[#00fff9] resize-none"
                        />
                      </div>
                    )}
                    {sendingPanel?.type === 'confirmation' && (
                      <p className="text-xs text-[#8890b0]">
                        This will send a booking confirmation email with all current event details to {s.employees?.name}.
                      </p>
                    )}
                    {sendError && <p className="text-xs text-[#ff2d78]">{sendError}</p>}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={closePanel}
                        className="px-3 py-1.5 text-xs text-[#4a5580] hover:text-[#c8d0f0] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendEmail}
                        disabled={sending}
                        className="px-3 py-1.5 text-xs bg-[#00fff9] text-[#080812] font-semibold rounded-sm hover:bg-[#00e0e0] disabled:opacity-50 transition-colors"
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
