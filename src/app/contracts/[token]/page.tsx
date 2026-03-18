import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Addon = {
  id: string
  description: string
  price: number
}

type Contract = {
  id: string
  package: string
  base_price: number
  total_price: number
  balance_due: number
  deposit_paid: boolean
  contract_addons: Addon[]
  events: {
    title: string
    event_type: string
    event_date: string
    location: string
    contracted_start: string | null
    contracted_end: string | null
    clients: {
      name: string
      email: string
    } | null
  } | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export default async function PublicContractPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      id, package, base_price, total_price, balance_due, deposit_paid,
      contract_addons (id, description, price),
      events (title, event_type, event_date, location, contracted_start, contracted_end,
        clients (name, email)
      )
    `)
    .eq('share_token', token)
    .single()

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
        Contract not found.
      </div>
    )
  }

  const contract = data as Contract
  const event = contract.events

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">HighTone Entertainment</p>
          <h1 className="text-2xl font-semibold text-gray-900">Event Contract</h1>
          {event && (
            <p className="text-sm text-gray-500 mt-1">{event.title}</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">

          {/* Event details */}
          {event && (
            <div className="px-6 py-5">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Event Details</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="text-gray-900">{event.event_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900">{formatDate(event.event_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="text-gray-900">{event.location}</span>
                </div>
                {event.contracted_start && event.contracted_end && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time</span>
                    <span className="text-gray-900">
                      {formatTime(event.contracted_start)} – {formatTime(event.contracted_end)}
                    </span>
                  </div>
                )}
                {event.clients && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="text-gray-900">{event.clients.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Package + Addons */}
          <div className="px-6 py-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Services</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-900">{contract.package}</span>
                <span className="text-gray-900">${contract.base_price.toLocaleString()}</span>
              </div>
              {contract.contract_addons.map((addon) => (
                <div key={addon.id} className="flex justify-between">
                  <span className="text-gray-600">{addon.description}</span>
                  <span className="text-gray-600">${addon.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing summary */}
          <div className="px-6 py-5 space-y-2 text-sm">
            <div className="flex justify-between font-medium text-gray-900">
              <span>Total</span>
              <span>${contract.total_price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Deposit</span>
              <span className={contract.deposit_paid ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                {contract.deposit_paid ? 'Paid' : 'Unpaid'}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100">
              <span>Balance due</span>
              <span>${contract.balance_due.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Questions? Contact us at info@hightoneentertainment.com
        </p>
      </div>
    </div>
  )
}
