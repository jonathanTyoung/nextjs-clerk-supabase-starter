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
          <h1 className="text-lg font-semibold text-[#c8d0f0] tracking-wide uppercase">Employees</h1>
          <p className="text-sm text-[#4a5580] mt-0.5">DJs, photo booth, and A/V staff</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#00fff9] text-[#080812] font-semibold text-sm px-4 py-2 rounded-sm hover:bg-[#00e0e0] transition-colors tracking-wide"
        >
          + Add Employee
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-[#4a5580]">
          Loading employees...
        </div>
      ) : employees.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-[#4a5580]">
          No employees yet.
        </div>
      ) : (
        <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e4a]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Pay rate</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e4a]">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#1a1a3e] transition-colors">
                  <td className="px-5 py-3 font-medium text-[#c8d0f0]">{emp.name}</td>
                  <td className="px-5 py-3 text-[#8890b0]">{emp.role}</td>
                  <td className="px-5 py-3 text-[#8890b0]">{emp.email}</td>
                  <td className="px-5 py-3 text-[#4a5580]">{emp.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-[#4a5580]">
                    {emp.pay_rate != null ? `$${emp.pay_rate}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setEditing(emp)}
                      className="text-sm text-[#00fff9] hover:text-[#00e0e0] transition-colors"
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
