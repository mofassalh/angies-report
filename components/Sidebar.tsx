'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const nav = [
  {
    label: 'Dashboard', icon: LayoutDashboard,
    children: [
      { label: 'Revenue Analysis', href: '/dashboard/revenue' },
      { label: 'Cost Analysis', href: '/dashboard/cost' },
      { label: 'P&L Summary', href: '/dashboard/pl' },
      { label: 'Location Wise', href: '/dashboard/location' },
      { label: 'Channel Performance', href: '/sales/channel' },
      { label: 'Transaction Analysis', href: '/sales/transactions' },
      { label: 'Growth Trends', href: '/sales/growth' },
    ]
  },
  {
    label: 'Reporting', icon: FileText,
    children: [
      { label: 'Report', href: '/report' },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{ width:220, flexShrink:0, height:'100vh', background:'#fff', borderRight:'1px solid #e5e5e5', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #e5e5e5', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:'#F5C800', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>A</div>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:'#1A1A1A' }}>Angie's Reports</div>
          <div style={{ fontSize:11, color:'#888' }}>Business Intelligence</div>
        </div>
      </div>
      <nav style={{ flex:1, padding:12, overflowY:'auto' }}>
        {nav.map(section => {
          const Icon = section.icon
          return (
            <div key={section.label} style={{ marginBottom:4 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', fontSize:11, fontWeight:600, color:'#aaa', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                <Icon size={14}/>{section.label}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
                {section.children.map(child => {
                  const isActive = pathname === child.href
                  return (
                    <Link key={child.href} href={child.href} style={{ display:'block', padding:'7px 10px 7px 28px', borderRadius:8, textDecoration:'none', fontSize:13, background:isActive?'#F5C800':'transparent', color:isActive?'#1A1A1A':'#555', fontWeight:isActive?600:400 }}>
                      {child.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
      <div style={{ padding:12, borderTop:'1px solid #e5e5e5' }}>
        <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, background:'transparent', border:'none', cursor:'pointer', color:'#888', fontSize:13, width:'100%' }}>
          <LogOut size={16}/>Logout
        </button>
      </div>
    </aside>
  )
}
