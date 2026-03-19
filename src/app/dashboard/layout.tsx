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
    <div className="flex h-screen bg-[#080812]">
      {/* Sidebar */}
      <div className="w-52 bg-[#0d0d24] border-r border-[#1e1e4a] flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="px-4 py-5 border-b border-[#1e1e4a]">
          <div className="text-sm font-semibold text-[#00fff9] tracking-widest uppercase">HighTone</div>
          <div className="text-xs text-[#4a5580] mt-0.5 tracking-wide">Event Assistant</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-4">
          {navigation.map((group) => (
            <div key={group.section}>
              <div className="px-2 mb-1 text-xs font-medium text-[#4a5580] uppercase tracking-widest">
                {group.section}
              </div>
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm rounded-sm mb-0.5 transition-colors ${
                      isActive
                        ? 'bg-[#00fff9]/10 text-[#00fff9] font-medium border-l-2 border-[#00fff9]'
                        : 'text-[#8890b0] hover:bg-[#1a1a3e] hover:text-[#c8d0f0]'
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
        <div className="px-4 py-3 border-t border-[#1e1e4a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#00fff9]/20 border border-[#00fff9]/30 flex items-center justify-center text-xs font-medium text-[#00fff9]">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <div className="text-xs font-medium text-[#c8d0f0]">{user?.firstName}</div>
              <div className="text-xs text-[#4a5580]">Admin</div>
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
