'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

interface Filters {
  locations: string[]
  restaurants: string[]
  period: string // 'all' | '2026-01' | '2026-Q1' | '2026'
  viewMode: 'weekly' | 'monthly' | 'yearly'
}

interface FilterContextType {
  filters: Filters
  setFilters: (f: Partial<Filters>) => void
  data: any[]
  restaurants: any[]
  locations: string[]
  availableMonths: {key: string, label: string}[]
  loading: boolean
  filteredData: any[]
  refetch: () => void
}

const FilterContext = createContext<FilterContextType | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<Filters>({
    locations: [],
    restaurants: [],
    period: 'all',
    viewMode: 'weekly',
  })
  const [data, setData] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<{key: string, label: string}[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    const { data: rests } = await supabase
      .from('report_restaurants')
      .select('*, report_locations(name)')
      .order('name')
    setRestaurants(rests || [])
    const locs = [...new Set((rests || []).map((r: any) => r.report_locations?.name).filter(Boolean))] as string[]
    setLocations(locs)

    const { data: weekly } = await supabase
      .from('report_weekly_data')
      .select('*, report_restaurants(name, brand, report_locations(name))')
      .order('week_start')
    const allData = weekly || []
    setData(allData)

    const monthMap: Record<string, string> = {}
    allData.forEach((d: any) => {
      const date = new Date(d.week_start)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
      monthMap[key] = label
    })
    const months = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).map(([key, label]) => ({ key, label }))
    setAvailableMonths(months)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const setFilters = (f: Partial<Filters>) => setFiltersState(prev => ({ ...prev, ...f }))

  const filteredData = data.filter(d => {
    const loc = d.report_restaurants?.report_locations?.name
    const rest = d.report_restaurants?.name

    const locMatch = filters.locations.length === 0 || filters.locations.includes(loc)
    const restMatch = filters.restaurants.length === 0 || filters.restaurants.includes(rest)

    let dateMatch = true
    if (filters.period !== 'all') {
      const week = d.week_start
      if (filters.period.length === 7) {
        // Month: 2026-01
        dateMatch = week.startsWith(filters.period)
      } else if (filters.period.includes('Q')) {
        // Quarter: 2026-Q1
        const [year, q] = filters.period.split('-Q')
        const qNum = parseInt(q)
        const month = parseInt(week.split('-')[1])
        const qMonth = Math.ceil(month / 3)
        dateMatch = week.startsWith(year) && qMonth === qNum
      } else {
        // Year: 2026
        dateMatch = week.startsWith(filters.period)
      }
    }

    return locMatch && restMatch && dateMatch
  })

  return (
    <FilterContext.Provider value={{ filters, setFilters, data, restaurants, locations, availableMonths, loading, filteredData, refetch: fetchData }}>
      {children}
    </FilterContext.Provider>
  )
}

export const useFilters = () => {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilters must be used within FilterProvider')
  return ctx
}
