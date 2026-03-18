'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Contract = {
  id: string
  package: string
  total_price: number
  balance_due: number
  deposit_paid: boolean
  share_token: string
}

type Props = {
  eventId: string
}

export default function ContractSection({ eventId }: Props) {
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase
      .from('contracts')
      .select('id, package, total_price, balance_due, deposit_paid, share_token')
      .eq('event_id', eventId)
      .eq('is_current', true)
      .maybeSingle()
      .then(({ data }) => {
        setContract(data ?? null)
        setLoading(false)
      })
  }, [eventId])

  function copyLink() {
    if (!contract) return
    navigator.clipboard.writeText(`${window.location.origin}/contracts/${contract.share_token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-900">Contract</p>
        {!loading && (
          <button
            onClick={() => router.push(`/dashboard/events/${eventId}/contract`)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {contract ? 'Edit' : '+ Create'}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading...</p>
      ) : !contract ? (
        <p className="text-sm text-gray-400">No contract yet.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Package</span>
            <span className="text-gray-900 font-medium">{contract.package}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total</span>
            <span className="text-gray-900 font-medium">${contract.total_price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Balance due</span>
            <span className="text-gray-900 font-medium">${contract.balance_due.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Deposit</span>
            <span className={contract.deposit_paid ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
              {contract.deposit_paid ? 'Paid' : 'Unpaid'}
            </span>
          </div>
          <div className="pt-2">
            <button
              onClick={copyLink}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              {copied ? 'Link copied!' : 'Copy client link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
