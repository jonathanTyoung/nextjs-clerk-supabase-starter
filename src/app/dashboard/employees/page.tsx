'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import EmployeeModal from '@/components/EmployeeModal'

type Employee = {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  pay_rate: number | null
  notes: string | null
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let active = true

    supabase
      .from('employees')
      .select('id, name, email, phone, role, pay_rate, notes')
      .order('name')
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error(error); return }
        setEmployees(data ?? [])
        setLoading(false)
      })

    return () => { active = false }
  }, [refreshTick])

  function handleSaved() {
    setRefreshTick((t) => t + 1)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Employees</h1>
          <p className="text-sm text-gray-400 mt-0.5">DJs, photo booth, and A/V staff</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Employee
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          Loading employees...
        </div>
      ) : employees.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          No employees yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Pay rate</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-5 py-3 text-gray-600">{emp.role}</td>
                  <td className="px-5 py-3 text-gray-600">{emp.email}</td>
                  <td className="px-5 py-3 text-gray-500">{emp.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {emp.pay_rate != null ? `$${emp.pay_rate}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setEditing(emp)}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <EmployeeModal
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}

      {editing && (
        <EmployeeModal
          employee={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
