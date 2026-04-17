'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { TrendingUp, ShoppingBag, MapPin, Clock, Upload, BarChart3, DollarSign, LogOut } from 'lucide-react'

export default function ReportDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [filterLocations, setFilterLocations] = useState<string[]>([])
  const [filterPeriod, setFilterPeriod] = useState('today')
  const [locations, setLocations] = useState<string[]>([])
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
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    const orders = data || []
    setAllOrders(orders)
    const locs = [...new Set(orders.map((o: any) => o.location).filter(Boolean))] as string[]
    setLocations(locs)
    setLoading(false)
  }

  const getDateRange = () => {
    const now = new Date()
    const start = new Date()
    if (filterPeriod === 'today') start.setHours(0, 0, 0, 0)
    else if (filterPeriod === 'week') start.setDate(now.getDate() - 7)
    else if (filterPeriod === 'month') start.setDate(1)
    else if (filterPeriod === 'year') { start.setMonth(0); start.setDate(1) }
    return start
  }

  const filteredOrders = allOrders.filter(o => {
    const locMatch = filterLocations.length === 0 || filterLocations.includes(o.location)
    const dateMatch = new Date(o.created_at) >= getDateRange()
    return locMatch && dateMatch
  })

  const revenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
  const avgOrder = filteredOrders.length > 0 ? revenue / filteredOrders.length : 0
  const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length

  // Top items
  const itemCounts: Record<string, { count: number, revenue: number }> = {}
  filteredOrders.forEach(o => {
    (o.items || []).forEach((item: any) => {
      if (!itemCounts[item.name]) itemCounts[item.name] = { count: 0, revenue: 0 }
      itemCounts[item.name].count += item.quantity || 1
      itemCounts[item.name].revenue += parseFloat(item.lineTotal || item.price || 0)
    })
  })
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  // Revenue by location
  const revenueByLocation: Record<string, number> = {}
  filteredOrders.forEach(o => {
    const loc = o.location || 'Unknown'
    revenueByLocation[loc] = (revenueByLocation[loc] || 0) + (parseFloat(o.total) || 0)
  })

  // Orders by hour
  const ordersByHour: Record<number, number> = {}
  filteredOrders.forEach(o => {
    const hour = new Date(o.created_at).getHours()
    ordersByHour[hour] = (ordersByHour[hour] || 0) + 1
  })
  const peakHour = Object.entries(ordersByHour).sort((a, b) => b[1] - a[1])[0]

  const toggleLocation = (loc: string) => {
    setFilterLocations(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const PERIODS = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: '7 Days' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #2a2a2a', backgroundColor: '#1a1a1a' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm" style={{ backgroundColor: '#F5C800' }}>A</div>
          <div>
            <h1 className="font-bold text-white">Angie's Reports</h1>
            <p className="text-xs" style={{ color: '#888' }}>Business Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: '#888' }}>{user?.email}</span>
          <button onClick={handleLogout} className="p-2 rounded-lg transition hover:bg-gray-800">
            <LogOut size={16} style={{ color: '#888' }} />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Period */}
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setFilterPeriod(p.key)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                style={{
                  backgroundColor: filterPeriod === p.key ? '#F5C800' : '#2a2a2a',
                  color: filterPeriod === p.key ? '#1A1A1A' : '#aaa',
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Locations */}
          {locations.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {locations.map(loc => (
                <button key={loc} onClick={() => toggleLocation(loc)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1"
                  style={{
                    backgroundColor: filterLocations.includes(loc) ? '#F5C800' : '#2a2a2a',
                    color: filterLocations.includes(loc) ? '#1A1A1A' : '#aaa',
                  }}>
                  <MapPin size={10} />
                  {filterLocations.includes(loc) ? '✓ ' : ''}{loc}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Revenue', value: `$${revenue.toFixed(2)}`, icon: DollarSign, color: '#F5C800' },
            { label: 'Orders', value: filteredOrders.length, icon: ShoppingBag, color: '#4a9eff' },
            { label: 'Avg Order', value: `$${avgOrder.toFixed(2)}`, icon: TrendingUp, color: '#22c55e' },
            { label: 'Cancelled', value: cancelledOrders, icon: BarChart3, color: '#ef4444' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: '#888' }}>{label}</span>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by Location */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin size={16} style={{ color: '#F5C800' }} /> Revenue by Location
            </h3>
            {Object.entries(revenueByLocation).length === 0 ? (
              <p className="text-sm" style={{ color: '#555' }}>No data</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(revenueByLocation).sort((a, b) => b[1] - a[1]).map(([loc, rev]) => {
                  const max = Math.max(...Object.values(revenueByLocation))
                  const pct = max > 0 ? (rev / max) * 100 : 0
                  return (
                    <div key={loc}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: '#ccc' }}>{loc}</span>
                        <span className="font-semibold text-white">${rev.toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: '#2a2a2a' }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#F5C800' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top Items */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} style={{ color: '#22c55e' }} /> Top Items
            </h3>
            {topItems.length === 0 ? (
              <p className="text-sm" style={{ color: '#555' }}>No data</p>
            ) : (
              <div className="space-y-3">
                {topItems.map(([name, data], i) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: i === 0 ? '#F5C800' : '#2a2a2a', color: i === 0 ? '#1A1A1A' : '#888' }}>
                        {i + 1}
                      </span>
                      <span className="text-sm" style={{ color: '#ccc' }}>{name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{data.count}x</div>
                      <div className="text-xs" style={{ color: '#888' }}>${data.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Peak Hours */}
          <div className="rounded-2xl p-5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={16} style={{ color: '#4a9eff' }} /> Orders by Hour
            </h3>
            {Object.keys(ordersByHour).length === 0 ? (
              <p className="text-sm" style={{ color: '#555' }}>No data</p>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 24 }, (_, h) => ({ hour: h, count: ordersByHour[h] || 0 }))
                  .filter(h => h.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 6)
                  .map(({ hour, count }) => {
                    const max = Math.max(...Object.values(ordersByHour))
                    const pct = max > 0 ? (count / max) * 100 : 0
                    const label = `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`
                    return (
                      <div key={hour}>
                        <div className="flex justify-between text-sm mb-1">
                          <span style={{ color: '#ccc' }}>{label}</span>
                          <span className="font-semibold text-white">{count} orders</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: '#2a2a2a' }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: '#4a9eff' }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>

        {/* CSV Import teaser */}
        <div className="mt-6 rounded-2xl p-5 flex items-center justify-between"
          style={{ backgroundColor: '#1a1a1a', border: '1px dashed #2a2a2a' }}>
          <div>
            <h3 className="font-semibold text-white">Import External Data</h3>
            <p className="text-sm mt-1" style={{ color: '#888' }}>Upload CSV from Uber Eats, DoorDash, Menulog or Lightspeed</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ backgroundColor: '#F5C800', color: '#1A1A1A' }}>
            <Upload size={14} /> Import CSV
          </button>
        </div>

      </div>
    </div>
  )
}
