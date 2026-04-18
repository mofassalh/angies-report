'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import FilterBar from '@/components/FilterBar'
import { FilterProvider } from '@/components/FilterContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const showFilterBar = !pathname.startsWith('/reporting')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setChecked(true)
    })
  }, [])

  if (!checked) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#F5C800', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <FilterProvider>
      <div className="flex min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {showFilterBar && <FilterBar />}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </FilterProvider>
  )
}
