'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { TrendingUp, DollarSign, MapPin, Zap, Activity, BarChart2, FileText, Database, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'

const nav = [
  {
    label: 'Dashboard',
    children: [
      { label: 'Revenue Analysis',     href: '/dashboard/revenue',   icon: TrendingUp },
      { label: 'Cost Analysis',        href: '/dashboard/cost',      icon: DollarSign },
      { label: 'P&L Summary',          href: '/dashboard/pl',        icon: BarChart2 },
      { label: 'Location Wise',        href: '/dashboard/location',  icon: MapPin },
      { label: 'Channel Performance',  href: '/sales/channel',       icon: Zap },
      { label: 'Transaction Analysis', href: '/sales/transactions',  icon: Activity },
      { label: 'Growth Trends',        href: '/sales/growth',        icon: TrendingUp },
    ]
  },
  {
    label: 'Reporting',
    children: [
      { label: 'Data Input',            href: '/data-input',               icon: Database },
      { label: 'Weekly Details Report', href: '/reporting/weekly-details', icon: FileText },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const supabase = createClient()
  const expanded = hovered

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: expanded ? 220 : 60,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100vh',
        background: 'white',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: expanded ? '4px 0 20px rgba(0,0,0,0.06)' : 'none',
        zIndex: 10,
        position: 'relative',
      }}
    >
      <div style={{ padding: '14px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 10, height: 60, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F5C800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#1a1a1a', flexShrink: 0, boxShadow: '0 2px 8px rgba(245,200,0,0.4)' }}>A</div>
        {expanded && (
          <div style={{ opacity: 1, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a1a', lineHeight: 1.2 }}>Angie's Reports</div>
            <div style={{ fontSize: 10, color: '#aaa' }}>Business Intelligence</div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {nav.map(section => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            {expanded ? (
              <div style={{ fontSize: 9, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: 1.5, padding: '6px 8px 4px', whiteSpace: 'nowrap' }}>
                {section.label}
              </div>
            ) : (
              <div style={{ height: 1, background: '#f5f5f5', margin: '6px 4px' }} />
            )}
            {section.children.map(child => {
              const ItemIcon = child.icon
              const isActive = pathname === child.href
              const isHov = hoveredItem === child.href
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onMouseEnter={() => setHoveredItem(child.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                    background: isActive ? '#FFF9E0' : isHov ? '#fafafa' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    position: 'relative',
                    marginBottom: 2,
                  }}
                >
                  {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: 3, background: '#F5C800', borderRadius: '0 2px 2px 0' }} />}
                  <ItemIcon size={16} color={isActive ? '#D4A900' : isHov ? '#6366f1' : '#ccc'} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
                  {expanded && (
                    <span style={{ fontSize: 12.5, whiteSpace: 'nowrap', color: isActive ? '#7A5F00' : isHov ? '#1a1a1a' : '#888', fontWeight: isActive ? 600 : 400, transition: 'color 0.15s' }}>
                      {child.label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '1px solid #f5f5f5' }}>
        <div
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={16} color='#ccc' style={{ flexShrink: 0 }} />
          {expanded && <span style={{ fontSize: 12.5, color: '#aaa', whiteSpace: 'nowrap' }}>Logout</span>}
        </div>
      </div>
    </aside>
  )
}
