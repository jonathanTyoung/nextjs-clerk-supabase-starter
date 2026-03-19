'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Client = {
  id: string
  name: string
  email: string
  phone: string | null
  notes: string | null
}

type Props = {
  client?: Client
  onClose: () => void
  onSaved: () => void
}

export default function ClientModal({ client, onClose, onSaved }: Props) {
  const isEdit = !!client
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: client?.name ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    notes: client?.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      notes: form.notes || null,
    }

    const { error: dbError } = isEdit
      ? await supabase.from('clients').update(payload).eq('id', client.id)
      : await supabase.from('clients').insert(payload)

    if (dbError) {
      setError(dbError.message)
      setSubmitting(false)
      return
    }

    onSaved()
    onClose()
  }

  const inputClass = "w-full border border-[#1e1e4a] rounded-sm px-3 py-2 text-sm text-[#c8d0f0] bg-[#080812] placeholder:text-[#4a5580] focus:outline-none focus:ring-2 focus:ring-[#00fff9]/50 focus:border-[#00fff9]"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-[#0d0d24] border border-[#1e1e4a] rounded-sm shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e4a]">
          <h2 className="text-base font-semibold text-[#c8d0f0] tracking-wide uppercase">
            {isEdit ? 'Edit Client' : 'New Client'}
          </h2>
          <button onClick={onClose} className="text-[#4a5580] hover:text-[#00fff9] transition-colors text-lg leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Name <span className="text-[#ff2d78]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Sarah & Tom Mitchell"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Email <span className="text-[#ff2d78]">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Phone <span className="text-[#4a5580] font-normal normal-case">(optional)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8890b0] uppercase tracking-wide mb-1">
              Notes <span className="text-[#4a5580] font-normal normal-case">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-sm text-[#ff2d78]">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#4a5580] hover:text-[#c8d0f0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-[#00fff9] text-[#080812] font-semibold rounded-sm hover:bg-[#00e0e0] disabled:opacity-50 transition-colors tracking-wide"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
