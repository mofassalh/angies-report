'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, FileText, LogOut } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/revenue',
    children: [
      { label: 'Revenue Analysis', href: '/dashboard/revenue' },
      { label: 'Cost Analysis', href: '/dashboard/cost' },
      { label: 'P&L Summary', href: '/dashboard/pl' },
      { label: 'Location Wise', href: '/dashboard/location' },
    ]
  },
  { label: 'Sales Analysis', icon: TrendingUp, href: '/sales/channel',
    children: [
      { label: 'Channel Performance', href: '/sales/channel' },
      { label: 'Transaction Analysis', href: '/sales/transactions' },
      { label: 'Growth Trends', href: '/sales/growth' },
    ]
  },
  { label: 'Reporting', icon: FileText, href: '/reporting',
    children: [
      { label: 'Report', href: '/reporting' },
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

  return (
    <>
      {open && <div className="fixed inset-0 z-40 lg:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setOpen(false)} />}
      <aside className="hidden lg:flex flex-col w-56 bg-white flex-shrink-0" style={{ borderRight: '1px solid #e5e5e5', minHeight: '100vh' }}>
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
            const isActive = pathname.startsWith(item.href.split('/')[1] === 'reporting' ? '/reporting' : `/${item.href.split('/')[1]}`)
            const Icon = item.icon
            return (
              <div key={item.href}>
                <Link href={item.children[0].href} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ backgroundColor: isActive ? '#FFF9E0' : 'transparent', color: isActive ? '#b8860b' : '#555' }}>
                  <Icon size={16} />{item.label}
                </Link>
                {isActive && item.children.length > 1 && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    {item.children.map(child => (
                      <Link key={child.href} href={child.href} className="block px-3 py-1.5 rounded-lg text-xs transition-all" style={{ backgroundColor: pathname === child.href ? '#F5C800' : 'transparent', color: pathname === child.href ? '#1A1A1A' : '#888', fontWeight: pathname === child.href ? 600 : 400 }}>
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
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm w-full transition hover:bg-gray-100" style={{ color: '#888' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}
