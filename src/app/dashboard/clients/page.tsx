'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ClientModal from '@/components/ClientModal'

type Client = {
  id: string
  name: string
  email: string
  phone: string | null
  notes: string | null
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let active = true

    supabase
      .from('clients')
      .select('id, name, email, phone, notes')
      .order('name')
      .then(({ data, error }) => {
        if (!active) return
        if (error) { console.error(error); return }
        setClients(data ?? [])
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
          <h1 className="text-lg font-semibold text-[#c8d0f0] tracking-wide uppercase">Clients</h1>
          <p className="text-sm text-[#4a5580] mt-0.5">All HighTone clients</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#00fff9] text-[#080812] font-semibold text-sm px-4 py-2 rounded-sm hover:bg-[#00e0e0] transition-colors tracking-wide"
        >
          + Add Client
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-[#4a5580]">
          Loading clients...
        </div>
      ) : clients.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-[#4a5580]">
          No clients yet.
        </div>
      ) : (
        <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e4a]">
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-[#00fff9] uppercase tracking-widest">Notes</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e4a]">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-[#1a1a3e] transition-colors">
                  <td className="px-5 py-3 font-medium text-[#c8d0f0]">{client.name}</td>
                  <td className="px-5 py-3 text-[#8890b0]">{client.email}</td>
                  <td className="px-5 py-3 text-[#4a5580]">{client.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-[#4a5580] max-w-xs truncate">{client.notes ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setEditing(client)}
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
        <ClientModal
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}

      {editing && (
        <ClientModal
          client={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
