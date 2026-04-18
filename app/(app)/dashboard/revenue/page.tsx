'use client'
import { useFilters } from '@/components/FilterContext'
import { DollarSign, TrendingUp, ShoppingBag, Users } from 'lucide-react'

export default function RevenuePage() {
  const { filteredData, loading } = useFilters()

  const sum = (key: string) => filteredData.reduce((s, d) => s + (parseFloat(d[key]) || 0), 0)
  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const storeRev = sum('revenue_store_net')
  const uberRev = sum('revenue_uber_gross')
  const ddRev = sum('revenue_doordash_gross')
  const totalRev = storeRev + uberRev + ddRev
  const totalTx = sum('transactions_store') + sum('transactions_uber') + sum('transactions_doordash')
  const avgTx = totalTx > 0 ? totalRev / totalTx : 0

  // Weekly trend
  const byWeek: Record<string, any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { store: 0, uber: 0, dd: 0, total: 0 }
    byWeek[w].store += parseFloat(d.revenue_store_net) || 0
    byWeek[w].uber += parseFloat(d.revenue_uber_gross) || 0
    byWeek[w].dd += parseFloat(d.revenue_doordash_gross) || 0
    byWeek[w].total += (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0)
  })
  const weeks = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))
  const maxTotal = Math.max(...weeks.map(w => w[1].total), 1)

  // Channel breakdown
  const channels = [
    { label: 'Physical Store', value: storeRev, color: '#F5C800', tx: sum('transactions_store') },
    { label: 'Uber Eats', value: uberRev, color: '#06C167', tx: sum('transactions_uber') },
    { label: 'DoorDash', value: ddRev, color: '#FF3008', tx: sum('transactions_doordash') },
  ]

  // Week over week growth
  const lastWeek = weeks[weeks.length - 1]
  const prevWeek = weeks[weeks.length - 2]
  const wow = prevWeek ? ((lastWeek?.[1]?.total - prevWeek?.[1]?.total) / prevWeek?.[1]?.total * 100) : 0

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Revenue Analysis</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: fmt(totalRev), sub: 'All channels', icon: DollarSign, color: '#F5C800', bg: '#FFF9E0' },
          { label: 'Transactions', value: totalTx.toLocaleString(), sub: 'Total orders', icon: ShoppingBag, color: '#4a9eff', bg: '#f0f8ff' },
          { label: 'Avg / Transaction', value: fmt(avgTx), sub: 'Revenue per order', icon: TrendingUp, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'WoW Growth', value: `${wow >= 0 ? '+' : ''}${wow.toFixed(1)}%`, sub: 'vs previous week', icon: Users, color: wow >= 0 ? '#22c55e' : '#ef4444', bg: wow >= 0 ? '#f0fdf4' : '#fff0f0' },
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
        {/* Channel breakdown */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Revenue by Channel</h3>
          <div className="space-y-4">
            {channels.map(({ label, value, color, tx }) => {
              const pct = totalRev > 0 ? (value / totalRev * 100) : 0
              const avg = tx > 0 ? value / tx : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#555' }}>{label}</span>
                    <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(value)}</span>
                  </div>
                  <div className="h-3 rounded-full mb-1" style={{ backgroundColor: '#f0f0f0' }}>
                    <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: '#aaa' }}>
                    <span>{pct.toFixed(1)}% of total</span>
                    <span>{tx.toLocaleString()} orders · {fmt(avg)}/order</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Donut-style channel share */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Channel Share</h3>
          <div className="space-y-3">
            {channels.map(({ label, value, color }) => {
              const pct = totalRev > 0 ? (value / totalRev * 100) : 0
              return (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#f9f9f9' }}>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#555' }}>{label}</span>
                      <span className="font-bold" style={{ color: '#1A1A1A' }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#aaa' }}>{fmtK(value)}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 flex justify-between" style={{ borderTop: '1px solid #e5e5e5' }}>
            <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>Total</span>
            <span className="text-sm font-bold" style={{ color: '#1A1A1A' }}>{fmt(totalRev)}</span>
          </div>
        </div>

        {/* Top weeks */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Top Weeks</h3>
          <div className="space-y-2">
            {[...weeks].sort((a, b) => b[1].total - a[1].total).slice(0, 6).map(([week, d], i) => (
              <div key={week} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: i === 0 ? '#F5C800' : '#f0f0f0', color: i === 0 ? '#1A1A1A' : '#888' }}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#555' }}>{new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                    <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmtK(d.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Revenue Chart (bar) */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Weekly Revenue Breakdown</h3>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Bar chart */}
            <div className="flex items-end gap-2 h-40 mb-2">
              {weeks.map(([week, d]) => (
                <div key={week} className="flex flex-col items-center gap-0.5 flex-1 min-w-12">
                  <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                    <div style={{ height: `${(d.dd / maxTotal * 100)}%`, backgroundColor: '#FF3008', borderRadius: '2px 2px 0 0', minHeight: d.dd > 0 ? '2px' : '0' }} />
                    <div style={{ height: `${(d.uber / maxTotal * 100)}%`, backgroundColor: '#06C167', minHeight: d.uber > 0 ? '2px' : '0' }} />
                    <div style={{ height: `${(d.store / maxTotal * 100)}%`, backgroundColor: '#F5C800', borderRadius: d.dd === 0 && d.uber === 0 ? '2px 2px 0 0' : '0', minHeight: d.store > 0 ? '2px' : '0' }} />
                  </div>
                </div>
              ))}
            </div>
            {/* X axis labels */}
            <div className="flex gap-2">
              {weeks.map(([week]) => (
                <div key={week} className="flex-1 min-w-12 text-center text-xs" style={{ color: '#aaa' }}>
                  {new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-4">
          {[{ label: 'Store', color: '#F5C800' }, { label: 'Uber', color: '#06C167' }, { label: 'DoorDash', color: '#FF3008' }].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: '#555' }}>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
