'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, FileText, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const nav = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    children: [
      { label: 'Revenue Analysis', href: '/dashboard/revenue' },
      { label: 'Cost Analysis', href: '/dashboard/cost' },
      { label: 'P&L Summary', href: '/dashboard/pl' },
      { label: 'Location Wise', href: '/dashboard/location' },
    ]
  },
  {
    label: 'Sales Analysis',
    icon: TrendingUp,
    href: '/sales',
    children: [
      { label: 'Channel Performance', href: '/sales/channel' },
      { label: 'Transaction Analysis', href: '/sales/transactions' },
      { label: 'Growth Trends', href: '/sales/growth' },
    ]
  },
  {
    label: 'Reporting',
    icon: FileText,
    href: '/reporting',
    children: [
      { label: 'Weekly Report', href: '/reporting/weekly' },
      { label: 'Monthly Report', href: '/reporting/monthly' },
      { label: 'Yearly Report', href: '/reporting/yearly' },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5" style={{ borderBottom: '1px solid #e5e5e5' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm" style={{ backgroundColor: '#F5C800' }}>A</div>
          <div>
            <div className="font-bold text-sm" style={{ color: '#1A1A1A' }}>Angie's Reports</div>
            <div className="text-xs" style={{ color: '#888' }}>Business Intelligence</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(item => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <div key={item.href}>
              <Link href={item.children[0].href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ backgroundColor: isActive ? '#FFF9E0' : 'transparent', color: isActive ? '#b8860b' : '#555' }}
                onClick={() => setOpen(false)}>
                <Icon size={16} />
                {item.label}
              </Link>
              {isActive && (
                <div className="ml-6 mt-1 space-y-0.5">
                  {item.children.map(child => (
                    <Link key={child.href} href={child.href}
                      className="block px-3 py-1.5 rounded-lg text-xs transition-all"
                      style={{ backgroundColor: pathname === child.href ? '#F5C800' : 'transparent', color: pathname === child.href ? '#1A1A1A' : '#888', fontWeight: pathname === child.href ? 600 : 400 }}
                      onClick={() => setOpen(false)}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-3" style={{ borderTop: '1px solid #e5e5e5' }}>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-full transition hover:bg-gray-100"
          style={{ color: '#888' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-white shadow"
        style={{ border: '1px solid #e5e5e5' }}>
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-white transform transition-transform lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderRight: '1px solid #e5e5e5' }}>
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4"><X size={18} /></button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white flex-shrink-0" style={{ borderRight: '1px solid #e5e5e5', minHeight: '100vh' }}>
        <SidebarContent />
      </aside>
    </>
  )
}
