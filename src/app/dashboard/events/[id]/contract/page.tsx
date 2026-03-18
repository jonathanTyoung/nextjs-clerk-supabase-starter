'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Addon = {
  id?: string
  description: string
  price: string
}

export default function ContractPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const router = useRouter()

  const [contractId, setContractId] = useState<string | null>(null)
  const [shareToken, setShareToken] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    package: '',
    base_price: '',
    balance_due: '',
    deposit_paid: false,
  })
  const [addons, setAddons] = useState<Addon[]>([])

  const totalPrice =
    (parseFloat(form.base_price) || 0) +
    addons.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0)

  useEffect(() => {
    supabase
      .from('contracts')
      .select('id, package, base_price, total_price, balance_due, deposit_paid, share_token, contract_addons (id, description, price)')
      .eq('event_id', eventId)
      .eq('is_current', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setContractId(data.id)
          setShareToken(data.share_token)
          setForm({
            package: data.package,
            base_price: data.base_price.toString(),
            balance_due: data.balance_due.toString(),
            deposit_paid: data.deposit_paid,
          })
          setAddons(
            (data.contract_addons ?? []).map((a: { id: string; description: string; price: number }) => ({
              id: a.id,
              description: a.description,
              price: a.price.toString(),
            }))
          )
        }
        setLoading(false)
      })
  }, [eventId])

  function setField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addAddon() {
    setAddons((prev) => [...prev, { description: '', price: '' }])
  }

  function updateAddon(index: number, field: 'description' | 'price', value: string) {
    setAddons((prev) => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  function removeAddon(index: number) {
    setAddons((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const token = shareToken || crypto.randomUUID()

    const contractPayload = {
      event_id: eventId,
      package: form.package,
      base_price: parseFloat(form.base_price) || 0,
      total_price: totalPrice,
      balance_due: parseFloat(form.balance_due) || 0,
      deposit_paid: form.deposit_paid,
      share_token: token,
      is_current: true,
    }

    let currentContractId = contractId

    if (contractId) {
      const { error: updateError } = await supabase
        .from('contracts')
        .update(contractPayload)
        .eq('id', contractId)
      if (updateError) { setError(updateError.message); setSubmitting(false); return }
    } else {
      const { data, error: insertError } = await supabase
        .from('contracts')
        .insert(contractPayload)
        .select('id')
        .single()
      if (insertError || !data) { setError(insertError?.message ?? 'Failed to create contract'); setSubmitting(false); return }
      currentContractId = data.id
    }

    // Replace all addons: delete existing, re-insert
    await supabase.from('contract_addons').delete().eq('contract_id', currentContractId)

    const validAddons = addons.filter((a) => a.description.trim())
    if (validAddons.length > 0) {
      const { error: addonsError } = await supabase.from('contract_addons').insert(
        validAddons.map((a) => ({
          contract_id: currentContractId,
          description: a.description,
          price: parseFloat(a.price) || 0,
        }))
      )
      if (addonsError) { setError(addonsError.message); setSubmitting(false); return }
    }

    router.push(`/dashboard/events/${eventId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-sm text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => router.push(`/dashboard/events/${eventId}`)}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6 flex items-center gap-1"
      >
        ← Back to event
      </button>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        {contractId ? 'Edit Contract' : 'Create Contract'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-100">

          {/* Package */}
          <div className="px-5 py-4">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Package <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={form.package}
              onChange={(e) => setField('package', e.target.value)}
              placeholder="e.g. Gold DJ Package"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Base price */}
          <div className="px-5 py-4">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Base price <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.base_price}
                onChange={(e) => setField('base_price', e.target.value)}
                className="w-full border border-gray-200 rounded-md pl-7 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Addons */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">Add-ons</label>
              <button
                type="button"
                onClick={addAddon}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                + Add line item
              </button>
            </div>
            {addons.length === 0 ? (
              <p className="text-sm text-gray-400">No add-ons.</p>
            ) : (
              <div className="space-y-2">
                {addons.map((addon, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Description"
                      value={addon.description}
                      onChange={(e) => updateAddon(i, 'description', e.target.value)}
                      className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="relative w-28">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={addon.price}
                        onChange={(e) => updateAddon(i, 'price', e.target.value)}
                        className="w-full border border-gray-200 rounded-md pl-7 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAddon(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total (calculated) */}
          <div className="px-5 py-4 bg-gray-50 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-sm font-semibold text-gray-900">${totalPrice.toLocaleString()}</span>
          </div>

          {/* Balance due */}
          <div className="px-5 py-4">
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Balance due <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.balance_due}
                onChange={(e) => setField('balance_due', e.target.value)}
                className="w-full border border-gray-200 rounded-md pl-7 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Deposit paid */}
          <div className="px-5 py-4 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Deposit paid</label>
            <button
              type="button"
              onClick={() => setField('deposit_paid', !form.deposit_paid)}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                form.deposit_paid ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
                  form.deposit_paid ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/events/${eventId}`)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Saving...' : contractId ? 'Save changes' : 'Create contract'}
          </button>
        </div>
      </form>
    </div>
  )
}
