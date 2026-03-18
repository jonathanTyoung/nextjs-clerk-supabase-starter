'use client'

import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

const navigation = [
  {
    section: 'Main',
    items: [
      { name: 'Calendar', href: '/dashboard' },
      { name: 'Events', href: '/dashboard/events' },
      { name: 'Clients', href: '/dashboard/clients' },
    ],
  },
  {
    section: 'Staff',
    items: [
      { name: 'Employees', href: '/dashboard/employees' },
    ],
  },
  {
    section: 'Admin',
    items: [
      { name: 'Contracts', href: '/dashboard/contracts' },
      { name: 'Payroll', href: '/dashboard/payroll' },
    ],
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-52 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-4 py-5 border-b border-gray-100">
          <div className="text-sm font-medium text-gray-900">HighTone</div>
          <div className="text-xs text-gray-400 mt-0.5">Event Assistant</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-4">
          {navigation.map((group) => (
            <div key={group.section}>
              <div className="px-2 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
                {group.section}
              </div>
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm rounded-md mb-0.5 transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <div className="text-xs font-medium text-gray-900">{user?.firstName}</div>
              <div className="text-xs text-gray-400">Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}