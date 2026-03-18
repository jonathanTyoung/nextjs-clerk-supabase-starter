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
          <h1 className="text-lg font-medium text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">All HighTone clients</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Client
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          Loading clients...
        </div>
      ) : clients.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          No clients yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Notes</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{client.name}</td>
                  <td className="px-5 py-3 text-gray-600">{client.email}</td>
                  <td className="px-5 py-3 text-gray-500">{client.phone ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{client.notes ?? '—'}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setEditing(client)}
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
