'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

interface Filters {
  locations: string[]
  restaurants: string[]
  months: string[]
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
    months: [],
  })
  const [data, setData] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<{key: string, label: string}[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)
    const { data: rests } = await supabase.from('report_restaurants').select('*, report_locations(name)').order('name')
    setRestaurants(rests || [])
    const locs = [...new Set((rests || []).map((r: any) => r.report_locations?.name).filter(Boolean))] as string[]
    setLocations(locs)
    const { data: weekly } = await supabase.from('report_weekly_data').select('*, report_restaurants(name, brand, report_locations(name))').order('week_start')
    const allData = weekly || []
    setData(allData)
    const monthMap: Record<string, string> = {}
    allData.forEach((d: any) => {
      const date = new Date(d.week_start)
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
      const label = date.toLocaleDateString('en-AU', { month:'long', year:'numeric' })
      monthMap[key] = label
    })
    const months = Object.entries(monthMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([key,label])=>({key,label}))
    setAvailableMonths(months)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const setFilters = (f: Partial<Filters>) => setFiltersState(prev => ({ ...prev, ...f }))

  const filteredData = data.filter(d => {
    const loc = d.report_restaurants?.report_locations?.name
    const rest = d.report_restaurants?.name
    const locMatch = filters.locations.length===0 || filters.locations.includes(loc)
    const restMatch = filters.restaurants.length===0 || filters.restaurants.includes(rest)
    const monthMatch = filters.months.length===0 || filters.months.includes(d.week_start.substring(0,7))
    return locMatch && restMatch && monthMatch
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
