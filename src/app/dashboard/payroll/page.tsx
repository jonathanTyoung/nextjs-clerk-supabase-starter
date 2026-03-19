'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type PayrollEntry = {
  id: string
  amount: number
  sent_to_josh: boolean
  sent_at: string | null
  created_at: string
  employees: { name: string } | null
  events: { title: string; event_date: string } | null
}

type Filter = 'all' | 'pending' | 'sent'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PayrollPage() {
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let active = true

    supabase
      .from('payroll_notes')
      .select('id, amount, sent_to_josh, sent_at, created_at, employees (name), events (title, event_date)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error(error); return }
        setEntries(data as PayrollEntry[] ?? [])
        setLoading(false)
      })

    return () => { active = false }
  }, [refreshTick])

  async function toggleSent(entry: PayrollEntry) {
    const nowSent = !entry.sent_to_josh
    await supabase
      .from('payroll_notes')
      .update({
        sent_to_josh: nowSent,
        sent_at: nowSent ? new Date().toISOString() : null,
      })
      .eq('id', entry.id)
    setRefreshTick((t) => t + 1)
  }

  const filtered = entries.filter((e) => {
    if (filter === 'pending') return !e.sent_to_josh
    if (filter === 'sent') return e.sent_to_josh
    return true
  })

  const totalPending = entries
    .filter((e) => !e.sent_to_josh)
    .reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-[#c8d0f0] tracking-wide uppercase">Payroll</h1>
          <p className="text-sm text-[#4a5580] mt-0.5">Track payments to staff</p>
        </div>
        {totalPending > 0 && (
          <div className="text-right">
            <p className="text-xs text-[#4a5580]">Pending total</p>
            <p className="text-lg font-semibold text-[#00fff9]">${totalPending.toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'sent'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-[#00fff9] text-[#080812]'
                : 'bg-[#131336] text-[#4a5580] hover:bg-[#1a1a3e]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-[#4a5580]">
          Loading payroll...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-[#4a5580]">
          No entries found.
        </div>
      ) : (
        <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e4a]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Employee</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Event</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Added</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Sent to Josh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e4a]">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#1a1a3e] transition-colors">
                  <td className="px-5 py-3 font-medium text-[#c8d0f0]">
                    {entry.employees?.name ?? 'Misc'}
                  </td>
                  <td className="px-5 py-3 text-[#8890b0]">
                    {entry.events ? (
                      <div>
                        <p>{entry.events.title}</p>
                        <p className="text-xs text-[#4a5580]">{formatDate(entry.events.event_date)}</p>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 font-medium text-[#c8d0f0]">
                    ${entry.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-[#4a5580]">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleSent(entry)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                        entry.sent_to_josh ? 'bg-[#00fff9]' : 'bg-[#1e1e4a]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-[#080812] shadow transform transition-transform mt-0.5 ${
                          entry.sent_to_josh ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
