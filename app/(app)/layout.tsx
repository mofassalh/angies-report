'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import FilterBar from '@/components/FilterBar'
import MobileNav from '@/components/MobileNav'
import { FilterProvider } from '@/components/FilterContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)
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

  if (!checked) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f8f9fc' }}>
      <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid #F5C800', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )

  return (
    <FilterProvider>
      <div style={{ display:'flex', height:'100vh', overflow:'hidden', backgroundColor:'#f8f9fc' }}>
        {/* Desktop Sidebar */}
        <div className="hidden md:block" style={{ flexShrink:0, height:'100vh', position:'sticky', top:0 }}>
          <Sidebar />
        </div>
        {/* Main Content */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, height:'100vh', overflow:'hidden' }}>
          {showFilterBar && <FilterBar />}
          <main style={{ flex:1, overflow:'auto', paddingBottom: 80 }}>
            <div style={{ padding: 24 }}>
              {children}
            </div>
          </main>
        </div>
      </div>
      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </FilterProvider>
  )
}
