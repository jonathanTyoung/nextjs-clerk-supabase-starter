'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Employee = {
  id: string
  name: string
}

type PayrollEntry = {
  id: string
  amount: number
  sent_to_josh: boolean
  employees: { name: string } | null
}

type Props = {
  eventId: string
}

export default function PayrollSection({ eventId }: Props) {
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([
      supabase
        .from('payroll_notes')
        .select('id, amount, sent_to_josh, employees (name)')
        .eq('event_id', eventId)
        .order('created_at'),
      supabase
        .from('employees')
        .select('id, name')
        .order('name'),
    ]).then(([payrollRes, empRes]) => {
      if (!active) return
      if (payrollRes.data) setEntries(payrollRes.data as PayrollEntry[])
      if (empRes.data) setEmployees(empRes.data)
    })

    return () => { active = false }
  }, [eventId, refreshTick])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setAddError(null)

    const { error } = await supabase.from('payroll_notes').insert({
      event_id: eventId,
      employee_id: selectedEmployee || null,
      amount: parseFloat(amount) || 0,
      sent_to_josh: false,
    })

    if (error) { setAddError(error.message); setSubmitting(false); return }

    setShowAdd(false)
    setSelectedEmployee('')
    setAmount('')
    setRefreshTick((t) => t + 1)
    setSubmitting(false)
  }

  async function handleRemove(id: string) {
    await supabase.from('payroll_notes').delete().eq('id', id)
    setRefreshTick((t) => t + 1)
  }

  const inputClass = "w-full border border-[#1e1e4a] rounded-sm px-3 py-2 text-sm text-[#c8d0f0] bg-[#080812] focus:outline-none focus:ring-2 focus:ring-[#00fff9]/50 focus:border-[#00fff9]"

  return (
    <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#c8d0f0] uppercase tracking-wide">Payroll</p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-sm text-[#00fff9] hover:text-[#00e0e0] transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-[#080812] border border-[#1e1e4a] rounded-sm space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className={inputClass}
            >
              <option value="">— Misc / no employee —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#4a5580]">$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`${inputClass} pl-7`}
              />
            </div>
          </div>
          {addError && <p className="text-xs text-[#ff2d78]">{addError}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-sm bg-[#00fff9] text-[#080812] font-semibold rounded-sm hover:bg-[#00e0e0] disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add entry'}
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-[#4a5580]">No payroll entries yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between py-2 border-b border-[#1e1e4a] last:border-0">
              <div>
                <p className="text-sm font-medium text-[#c8d0f0]">{entry.employees?.name ?? 'Misc'}</p>
                <p className="text-xs text-[#4a5580]">${entry.amount.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${entry.sent_to_josh ? 'text-[#7dd44a]' : 'text-[#4a5580]'}`}>
                  {entry.sent_to_josh ? 'Sent to Josh' : 'Pending'}
                </span>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="text-xs text-[#4a5580] hover:text-[#ff2d78] transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
