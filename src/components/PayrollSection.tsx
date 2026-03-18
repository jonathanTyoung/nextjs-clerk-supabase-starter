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

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-900">Payroll</p>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Misc / no employee —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-md pl-7 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {addError && <p className="text-xs text-red-500">{addError}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add entry'}
            </button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">No payroll entries yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900">{entry.employees?.name ?? 'Misc'}</p>
                <p className="text-xs text-gray-500">${entry.amount.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${entry.sent_to_josh ? 'text-green-600' : 'text-gray-400'}`}>
                  {entry.sent_to_josh ? 'Sent to Josh' : 'Pending'}
                </span>
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
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
