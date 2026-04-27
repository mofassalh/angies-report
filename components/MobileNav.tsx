'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, BarChart2, MapPin, DollarSign, MoreHorizontal, X, Zap, Activity, FileText, Database } from 'lucide-react'
import { useState } from 'react'

const mainTabs = [
  { label: 'Revenue',  href: '/dashboard/revenue',  icon: TrendingUp },
  { label: 'P&L',      href: '/dashboard/pl',        icon: BarChart2 },
  { label: 'Location', href: '/dashboard/location',  icon: MapPin },
  { label: 'Cost',     href: '/dashboard/cost',      icon: DollarSign },
]

const moreTabs = [
  { label: 'Channel Performance',  href: '/sales/channel',            icon: Zap },
  { label: 'Transaction Analysis', href: '/sales/transactions',       icon: Activity },
  { label: 'Growth Trends',        href: '/sales/growth',             icon: TrendingUp },
  { label: 'Data Input',           href: '/data-input',               icon: Database },
  { label: 'Weekly Details',       href: '/reporting/weekly-details', icon: FileText },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.3)' }}
        />
      )}

      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 50,
        background: 'white', borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
        padding: '16px 0 8px',
        transform: showMore ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px 12px' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#1a1a1a' }}>More Pages</span>
          <button onClick={() => setShowMore(false)} style={{ border:'none', background:'none', cursor:'pointer', padding:4 }}>
            <X size={20} color="#888" />
          </button>
        </div>
        {moreTabs.map(tab => {
          const Icon = tab.icon
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setShowMore(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 20px',
                background: isActive ? '#FFF9E0' : 'transparent',
                textDecoration: 'none',
              }}
            >
              <Icon size={18} color={isActive ? '#D4A900' : '#aaa'} />
              <span style={{ fontSize:13, color: isActive ? '#7A5F00' : '#444', fontWeight: isActive ? 600 : 400 }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        height: 64, background: 'white',
        borderTop: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
      }}>
        {mainTabs.map(tab => {
          const Icon = tab.icon
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                textDecoration: 'none', padding: '8px 0',
              }}
            >
              <Icon size={20} color={isActive ? '#D4A900' : '#ccc'} />
              <span style={{ fontSize: 10, color: isActive ? '#D4A900' : '#bbb', fontWeight: isActive ? 600 : 400 }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
        <button
          onClick={() => setShowMore(o => !o)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            border: 'none', background: 'none', cursor: 'pointer', padding: '8px 0',
          }}
        >
          <MoreHorizontal size={20} color={showMore ? '#D4A900' : '#ccc'} />
          <span style={{ fontSize: 10, color: showMore ? '#D4A900' : '#bbb', fontWeight: showMore ? 600 : 400 }}>
            More
          </span>
        </button>
      </div>
    </>
  )
}
