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
  const [filters, setFiltersState] = useState<Filters>({ locations: [], restaurants: [], months: [] })
  const [data, setData] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [availableMonths, setAvailableMonths] = useState<{key: string, label: string}[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = async () => {
    setLoading(true)

    // Fetch from new table
    const { data: weekly } = await supabase
      .from('report_weekly_data')
      .select('restaurant_id,restaurant_name,location,week_start,partner,orders,gross_revenue,net_revenue,food_cost,staff_cost,operation_cost')
      .order('week_start')

    const raw = weekly || []

    // Group by restaurant_id + week_start to merge partner rows into one row per week per restaurant
    // This makes dashboard pages work the same way as before
    const grouped: Record<string, any> = {}
    for (const r of raw) {
      const key = `${r.restaurant_id}__${r.week_start}`
      if (!grouped[key]) {
        grouped[key] = {
          restaurant_id: r.restaurant_id,
          restaurant_name: r.restaurant_name,
          location: r.location,
          week_start: r.week_start,
          // old column names mapped to new data
          revenue_store_net: 0,
          revenue_uber_gross: 0,
          revenue_uber_net: 0,
          revenue_doordash_gross: 0,
          revenue_doordash_net: 0,
          transactions_store: 0,
          transactions_uber: 0,
          transactions_doordash: 0,
          cost_food: 0,
          cost_staff: 0,
          cost_operation: 0,
          // keep new columns too
          food_cost: r.food_cost || 0,
          staff_cost: r.staff_cost || 0,
          operation_cost: r.operation_cost || 0,
          // for backward compat
          report_restaurants: {
            name: r.restaurant_name,
            brand: r.restaurant_name,
            report_locations: { name: r.location }
          }
        }
      }
      const g = grouped[key]
      if (r.partner === 'Store') {
        g.revenue_store_net      += parseFloat(r.net_revenue) || 0
        g.transactions_store     += parseInt(r.orders) || 0
      } else if (r.partner === 'Uber Eats') {
        g.revenue_uber_gross     += parseFloat(r.gross_revenue) || 0
        g.revenue_uber_net       += parseFloat(r.net_revenue) || 0
        g.transactions_uber      += parseInt(r.orders) || 0
      } else if (r.partner === 'DoorDash') {
        g.revenue_doordash_gross += parseFloat(r.gross_revenue) || 0
        g.revenue_doordash_net   += parseFloat(r.net_revenue) || 0
        g.transactions_doordash  += parseInt(r.orders) || 0
      }
      // expenses — take from any row (same per restaurant per week)
      if (r.food_cost)      g.cost_food      = parseFloat(r.food_cost)
      if (r.staff_cost)     g.cost_staff     = parseFloat(r.staff_cost)
      if (r.operation_cost) g.cost_operation = parseFloat(r.operation_cost)
    }

    const allData = Object.values(grouped)
    setData(allData)

    // Locations and restaurants
    const locs = [...new Set(allData.map((r: any) => r.location).filter(Boolean))] as string[]
    setLocations(locs)
    const rests = [...new Set(allData.map((r: any) => r.restaurant_name).filter(Boolean))].map(name => ({
      name,
      report_locations: { name: allData.find((r: any) => r.restaurant_name === name)?.location || '' }
    }))
    setRestaurants(rests)

    // Months
    const monthMap: Record<string, string> = {}
    allData.forEach((d: any) => {
      const date = new Date(d.week_start + 'T00:00:00')
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
    const loc = d.location
    const rest = d.restaurant_name
    const locMatch  = filters.locations.length===0  || filters.locations.includes(loc)
    const restMatch = filters.restaurants.length===0 || filters.restaurants.includes(rest)
    const monthMatch = filters.months.length===0     || filters.months.includes(d.week_start.substring(0,7))
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
