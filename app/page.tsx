'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TrendingUp, ShoppingBag, MapPin, DollarSign, LogOut, RefreshCw } from 'lucide-react'

export default function ReportDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [availableMonths, setAvailableMonths] = useState<{key: string, label: string}[]>([])
  const [filterLocation, setFilterLocation] = useState('all')
  const [filterRestaurant, setFilterRestaurant] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      fetchData()
    })
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: rests } = await supabase
      .from('report_restaurants')
      .select('*, report_locations(name)')
      .order('name')
    setRestaurants(rests || [])
    const locs = [...new Set((rests || []).map((r: any) => r.report_locations?.name).filter(Boolean))]
    setLocations(locs as string[])

    const { data: weekly } = await supabase
      .from('report_weekly_data')
      .select('*, report_restaurants(name, brand, report_locations(name))')
      .order('week_start')
    const allData = weekly || []
    setData(allData)

    // Dynamic months from data
    const monthMap: Record<string, string> = {}
    allData.forEach((d: any) => {
      const date = new Date(d.week_start)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
      monthMap[key] = label
    })
    const months = Object.entries(monthMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, label]) => ({ key, label }))
    setAvailableMonths(months)

    setLoading(false)
  }

  const getDateFilter = () => {
    if (filterPeriod === 'all') return null
    // filterPeriod is like '2026-01'
    const [year, month] = filterPeriod.split('-').map(Number)
    const start = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const end = new Date(year, month, 0).toISOString().split('T')[0]
    return { start, end }
  }

  const filtered = data.filter(d => {
    const loc = d.report_restaurants?.report_locations?.name
    const rest = d.report_restaurants?.name
    const locMatch = filterLocation === 'all' || loc === filterLocation
    const restMatch = filterRestaurant === 'all' || rest === filterRestaurant
    const dateFilter = getDateFilter()
    const dateMatch = !dateFilter || (d.week_start >= dateFilter.start && d.week_start <= dateFilter.end)
    return locMatch && restMatch && dateMatch
  })

  const sum = (key: string) => filtered.reduce((s, d) => s + (parseFloat(d[key]) || 0), 0)

  const totalRevStore = sum('revenue_store_net')
  const totalRevUber = sum('revenue_uber_gross')
  const totalRevDD = sum('revenue_doordash_gross')
  const totalRevGross = totalRevStore + totalRevUber + totalRevDD
  const totalCostFood = sum('cost_food')
  const totalCostStaff = sum('cost_staff')
  const totalCostOp = sum('cost_operation')
  const totalCost = totalCostFood + totalCostStaff + totalCostOp
  const totalTx = sum('transactions_store') + sum('transactions_uber') + sum('transactions_doordash')
  const grossProfit = totalRevGross - totalCost
  const profitPct = totalRevGross > 0 ? (grossProfit / totalRevGross * 100) : 0

  const byLocation: Record<string, any> = {}
  filtered.forEach(d => {
    const loc = d.report_restaurants?.report_locations?.name || 'Unknown'
    if (!byLocation[loc]) byLocation[loc] = { revenue: 0, cost: 0, tx: 0 }
    byLocation[loc].revenue += (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0)
    byLocation[loc].cost += (parseFloat(d.cost_food) || 0) + (parseFloat(d.cost_staff) || 0) + (parseFloat(d.cost_operation) || 0)
    byLocation[loc].tx += (parseInt(d.transactions_store) || 0) + (parseInt(d.transactions_uber) || 0) + (parseInt(d.transactions_doordash) || 0)
  })

  const byWeek: Record<string, any> = {}
  filtered.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { revenue: 0, cost: 0, profit: 0 }
    const rev = (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0)
    const cost = (parseFloat(d.cost_food) || 0) + (parseFloat(d.cost_staff) || 0) + (parseFloat(d.cost_operation) || 0)
    byWeek[w].revenue += rev
    byWeek[w].cost += cost
    byWeek[w].profit += rev - cost
  })
  const weeklyData = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))
  const maxRevenue = Math.max(...weeklyData.map(w => w[1].revenue), 1)

  const filteredRestaurants = filterLocation === 'all'
    ? restaurants
    : restaurants.filter((r: any) => r.report_locations?.name === filterLocation)

  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
      <header className="px-6 py-4 flex items-center justify-between bg-white" style={{ borderBottom: '1px solid #e5e5e5' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm" style={{ backgroundColor: '#F5C800' }}>A</div>
          <div>
            <h1 className="font-bold" style={{ color: '#1A1A1A' }}>Angie's P&L Report</h1>
            <p className="text-xs" style={{ color: '#888' }}>Business Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-gray-100">
            <RefreshCw size={16} style={{ color: '#888' }} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} className="p-2 rounded-lg hover:bg-gray-100">
            <LogOut size={16} style={{ color: '#888' }} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center" style={{ border: '1px solid #e5e5e5' }}>
          {/* Period — dynamic */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilterPeriod('all')}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition"
              style={{ backgroundColor: filterPeriod === 'all' ? '#F5C800' : '#f5f5f5', color: filterPeriod === 'all' ? '#1A1A1A' : '#666', border: '1px solid #e5e5e5' }}>
              All Time
            </button>
            {availableMonths.map(m => (
              <button key={m.key} onClick={() => setFilterPeriod(m.key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                style={{ backgroundColor: filterPeriod === m.key ? '#F5C800' : '#f5f5f5', color: filterPeriod === m.key ? '#1A1A1A' : '#666', border: '1px solid #e5e5e5' }}>
                {m.label}
              </button>
            ))}
          </div>

          <select value={filterLocation} onChange={e => { setFilterLocation(e.target.value); setFilterRestaurant('all') }}
            className="px-3 py-1.5 rounded-full text-xs font-medium outline-none"
            style={{ border: '1px solid #e5e5e5', color: '#666', backgroundColor: filterLocation !== 'all' ? '#FFF9E0' : '#f5f5f5' }}>
            <option value="all">All Locations</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>

          <select value={filterRestaurant} onChange={e => setFilterRestaurant(e.target.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium outline-none"
            style={{ border: '1px solid #e5e5e5', color: '#666', backgroundColor: filterRestaurant !== 'all' ? '#FFF9E0' : '#f5f5f5' }}>
            <option value="all">All Restaurants</option>
            {filteredRestaurants.map((r: any) => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>

          {(filterLocation !== 'all' || filterRestaurant !== 'all') && (
            <button onClick={() => { setFilterLocation('all'); setFilterRestaurant('all') }}
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#fff0f0', color: '#cc0000', border: '1px solid #ffcccc' }}>
              Clear ✕
            </button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Gross Revenue', value: fmt(totalRevGross), sub: `${totalTx.toLocaleString()} transactions`, icon: DollarSign, color: '#F5C800', bg: '#FFF9E0' },
            { label: 'Total Cost', value: fmt(totalCost), sub: 'Food + Staff + Operations', icon: ShoppingBag, color: '#ef4444', bg: '#fff0f0' },
            { label: 'Gross Profit', value: fmt(grossProfit), sub: `${profitPct.toFixed(1)}% margin`, icon: TrendingUp, color: grossProfit >= 0 ? '#22c55e' : '#ef4444', bg: grossProfit >= 0 ? '#f0fdf4' : '#fff0f0' },
            { label: 'Avg/Transaction', value: fmt(totalTx > 0 ? totalRevGross / totalTx : 0), sub: 'Across all channels', icon: MapPin, color: '#4a9eff', bg: '#f0f8ff' },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: '#888' }}>{label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
                  <Icon size={14} style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{loading ? '—' : value}</p>
              <p className="text-xs mt-1" style={{ color: '#aaa' }}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue by Channel */}
          <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Revenue by Channel</h3>
            {[
              { label: 'Physical Store', value: totalRevStore, color: '#F5C800' },
              { label: 'Uber Eats', value: totalRevUber, color: '#06C167' },
              { label: 'DoorDash', value: totalRevDD, color: '#FF3008' },
            ].map(({ label, value, color }) => {
              const pct = totalRevGross > 0 ? (value / totalRevGross * 100) : 0
              return (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#555' }}>{label}</span>
                    <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(value)} <span className="text-xs font-normal" style={{ color: '#aaa' }}>({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Cost Breakdown */}
          <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Cost Breakdown</h3>
            {[
              { label: 'Food Cost', value: totalCostFood, color: '#f97316' },
              { label: 'Staff Cost', value: totalCostStaff, color: '#8b5cf6' },
              { label: 'Operations', value: totalCostOp, color: '#4a9eff' },
            ].map(({ label, value, color }) => {
              const pct = totalCost > 0 ? (value / totalCost * 100) : 0
              const revPct = totalRevGross > 0 ? (value / totalRevGross * 100) : 0
              return (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#555' }}>{label}</span>
                    <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(value)} <span className="text-xs font-normal" style={{ color: '#aaa' }}>({revPct.toFixed(0)}% of rev)</span></span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* By Location */}
          <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>By Location</h3>
            {Object.entries(byLocation).map(([loc, d]) => {
              const profit = d.revenue - d.cost
              const pct = d.revenue > 0 ? (profit / d.revenue * 100) : 0
              return (
                <div key={loc} className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#f9f9f9' }}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{loc}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: profit >= 0 ? '#dcfce7' : '#fee2e2', color: profit >= 0 ? '#16a34a' : '#dc2626' }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: '#888' }}>
                    <span>Rev: {fmtK(d.revenue)}</span>
                    <span>Cost: {fmtK(d.cost)}</span>
                    <span>Profit: {fmtK(profit)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="rounded-2xl p-5 bg-white mb-6" style={{ border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Weekly Revenue Trend</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <th className="text-left py-2 pr-4 font-medium" style={{ color: '#888' }}>Week</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: '#888' }}>Revenue</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: '#888' }}>Cost</th>
                  <th className="text-right py-2 px-2 font-medium" style={{ color: '#888' }}>Profit</th>
                  <th className="text-right py-2 pl-2 font-medium" style={{ color: '#888' }}>Margin</th>
                  <th className="py-2 pl-4 font-medium w-32" style={{ color: '#888' }}>Bar</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.map(([week, d]) => {
                  const margin = d.revenue > 0 ? (d.profit / d.revenue * 100) : 0
                  const barPct = (d.revenue / maxRevenue * 100)
                  return (
                    <tr key={week} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td className="py-2 pr-4 font-medium" style={{ color: '#555' }}>
                        {new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold" style={{ color: '#1A1A1A' }}>{fmtK(d.revenue)}</td>
                      <td className="py-2 px-2 text-right" style={{ color: '#888' }}>{fmtK(d.cost)}</td>
                      <td className="py-2 px-2 text-right font-semibold" style={{ color: d.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmtK(d.profit)}</td>
                      <td className="py-2 pl-2 text-right" style={{ color: margin >= 20 ? '#16a34a' : margin >= 10 ? '#d97706' : '#dc2626' }}>
                        {margin.toFixed(1)}%
                      </td>
                      <td className="py-2 pl-4">
                        <div className="h-3 rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                          <div className="h-3 rounded-full" style={{ width: `${barPct}%`, backgroundColor: '#F5C800' }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Restaurant Details */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Restaurant Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants
              .filter(r => filterLocation === 'all' || r.report_locations?.name === filterLocation)
              .filter(r => filterRestaurant === 'all' || r.name === filterRestaurant)
              .map((r: any) => {
                const rData = filtered.filter(d => d.report_restaurants?.name === r.name)
                const rev = rData.reduce((s, d) => s + (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0), 0)
                const cost = rData.reduce((s, d) => s + (parseFloat(d.cost_food) || 0) + (parseFloat(d.cost_staff) || 0) + (parseFloat(d.cost_operation) || 0), 0)
                const profit = rev - cost
                const margin = rev > 0 ? (profit / rev * 100) : 0
                const uberRev = rData.reduce((s, d) => s + (parseFloat(d.revenue_uber_gross) || 0), 0)
                const ddRev = rData.reduce((s, d) => s + (parseFloat(d.revenue_doordash_gross) || 0), 0)
                const storeRev = rData.reduce((s, d) => s + (parseFloat(d.revenue_store_net) || 0), 0)
                return (
                  <div key={r.id} className="p-4 rounded-xl" style={{ backgroundColor: '#f9f9f9', border: '1px solid #e5e5e5' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{r.name}</div>
                        <div className="text-xs" style={{ color: '#888' }}>{r.report_locations?.name}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                        style={{ backgroundColor: r.brand === 'angies' ? '#FFF9E0' : '#f0fdf4', color: r.brand === 'angies' ? '#b8860b' : '#16a34a' }}>
                        {r.brand}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span style={{ color: '#888' }}>Revenue</span><span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(rev)}</span></div>
                      <div className="flex justify-between"><span style={{ color: '#888' }}>Cost</span><span style={{ color: '#888' }}>{fmt(cost)}</span></div>
                      <div className="flex justify-between border-t pt-1 mt-1" style={{ borderColor: '#e5e5e5' }}>
                        <span style={{ color: '#888' }}>Profit</span>
                        <span className="font-bold" style={{ color: profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(profit)} ({margin.toFixed(1)}%)</span>
                      </div>
                      <div className="flex justify-between mt-1"><span style={{ color: '#06C167' }}>Uber</span><span style={{ color: '#555' }}>{fmt(uberRev)}</span></div>
                      <div className="flex justify-between"><span style={{ color: '#FF3008' }}>DoorDash</span><span style={{ color: '#555' }}>{fmt(ddRev)}</span></div>
                      {storeRev > 0 && <div className="flex justify-between"><span style={{ color: '#F5C800' }}>Store</span><span style={{ color: '#555' }}>{fmt(storeRev)}</span></div>}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
