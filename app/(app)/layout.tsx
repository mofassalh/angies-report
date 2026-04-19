'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import FilterBar from '@/components/FilterBar'
import { FilterProvider } from '@/components/FilterContext'
import { Menu, X } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const showFilterBar = !pathname.startsWith('/reporting') && !pathname.startsWith('/data-input')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setChecked(true)
    })
  }, [])

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (!checked) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f5f5f5' }}>
      <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid #F5C800', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <FilterProvider>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', backgroundColor:'#f5f5f5' }}>

        {/* Desktop sidebar */}
        <div className="hidden md:block" style={{ flexShrink:0, height:'100vh', position:'sticky', top:0 }}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            style={{ position:'fixed', inset:0, zIndex:40, background:'rgba(0,0,0,0.4)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile sidebar drawer */}
        <div
          className="md:hidden"
          style={{
            position:'fixed', top:0, left:0, zIndex:50, height:'100vh',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
          }}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, height:'100vh', overflow:'hidden' }}>

          {/* Mobile top bar */}
          <div className="md:hidden" style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#fff', borderBottom:'1px solid #e5e5e5', flexShrink:0 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ border:'none', background:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center' }}>
              <Menu size={22} color="#1A1A1A" />
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:6, background:'#F5C800', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13 }}>A</div>
              <span style={{ fontWeight:600, fontSize:14, color:'#1A1A1A' }}>Angie's Reports</span>
            </div>
          </div>

          {showFilterBar && <FilterBar />}
          <main style={{ flex:1, overflow:'auto', padding:24 }}>
            {children}
          </main>
        </div>
      </div>
    </FilterProvider>
  )
}
