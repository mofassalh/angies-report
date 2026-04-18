'use client'
import { useFilters } from '@/components/FilterContext'

export default function ChannelPage() {
  const { filteredData, loading } = useFilters()

  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const sum = (key: string) => filteredData.reduce((s, d) => s + (parseFloat(d[key]) || 0), 0)

  const channels = [
    {
      label: 'Physical Store', color: '#F5C800', bg: '#FFF9E0',
      grossRev: sum('revenue_store_net'), netRev: sum('revenue_store_net'),
      tx: sum('transactions_store'), commission: 0,
    },
    {
      label: 'Uber Eats', color: '#06C167', bg: '#f0fdf4',
      grossRev: sum('revenue_uber_gross'), netRev: sum('revenue_uber_net'),
      tx: sum('transactions_uber'), commission: sum('revenue_uber_gross') - sum('revenue_uber_net'),
    },
    {
      label: 'DoorDash', color: '#FF3008', bg: '#fff0f0',
      grossRev: sum('revenue_doordash_gross'), netRev: sum('revenue_doordash_net'),
      tx: sum('transactions_doordash'), commission: sum('revenue_doordash_gross') - sum('revenue_doordash_net'),
    },
  ]

  const totalGross = channels.reduce((s, c) => s + c.grossRev, 0)
  const totalNet = channels.reduce((s, c) => s + c.netRev, 0)
  const totalTx = channels.reduce((s, c) => s + c.tx, 0)
  const totalCommission = channels.reduce((s, c) => s + c.commission, 0)

  // Weekly by channel
  const byWeek: Record<string, any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { store: 0, uber: 0, dd: 0 }
    byWeek[w].store += parseFloat(d.revenue_store_net) || 0
    byWeek[w].uber += parseFloat(d.revenue_uber_gross) || 0
    byWeek[w].dd += parseFloat(d.revenue_doordash_gross) || 0
  })
  const weeks = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Channel Performance</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Gross Revenue', value: fmt(totalGross), sub: 'Before commission', color: '#F5C800', bg: '#FFF9E0' },
          { label: 'Total Net Revenue', value: fmt(totalNet), sub: 'After commission', color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Total Commission', value: fmt(totalCommission), sub: `${totalGross > 0 ? (totalCommission/totalGross*100).toFixed(1) : 0}% of gross`, color: '#ef4444', bg: '#fff0f0' },
          { label: 'Total Transactions', value: totalTx.toLocaleString(), sub: 'All channels', color: '#4a9eff', bg: '#f0f8ff' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#888' }}>{label}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#1A1A1A' }}>{loading ? '—' : value}</div>
            <div className="text-xs" style={{ color: '#aaa' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Channel detail cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {channels.map(({ label, color, bg, grossRev, netRev, tx, commission }) => {
          const share = totalGross > 0 ? (grossRev / totalGross * 100) : 0
          const commPct = grossRev > 0 ? (commission / grossRev * 100) : 0
          const avgOrder = tx > 0 ? grossRev / tx : 0
          return (
            <div key={label} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="font-bold" style={{ color: '#1A1A1A' }}>{label}</h3>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span style={{ color: '#888' }}>Gross Revenue</span>
                  <span className="font-bold" style={{ color: '#1A1A1A' }}>{fmt(grossRev)}</span>
                </div>
                {commission > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span style={{ color: '#888' }}>Commission ({commPct.toFixed(1)}%)</span>
                      <span style={{ color: '#ef4444' }}>({fmt(commission)})</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1" style={{ borderTop: '1px solid #f0f0f0' }}>
                      <span style={{ color: '#888' }}>Net Revenue</span>
                      <span style={{ color: '#16a34a' }}>{fmt(netRev)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span style={{ color: '#888' }}>Transactions</span>
                  <span style={{ color: '#555' }}>{tx.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#888' }}>Avg / Order</span>
                  <span style={{ color: '#555' }}>{fmt(avgOrder)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: '#aaa' }}>
                  <span>Revenue Share</span><span>{share.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                  <div className="h-2 rounded-full" style={{ width: `${share}%`, backgroundColor: color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Weekly channel trend table */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Weekly Channel Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th className="text-left py-2 font-medium" style={{ color: '#888' }}>Week</th>
                <th className="text-right py-2 font-medium" style={{ color: '#F5C800' }}>Store</th>
                <th className="text-right py-2 font-medium" style={{ color: '#06C167' }}>Uber Eats</th>
                <th className="text-right py-2 font-medium" style={{ color: '#FF3008' }}>DoorDash</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Total</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Top Channel</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map(([week, d]) => {
                const total = d.store + d.uber + d.dd
                const topChannel = d.store >= d.uber && d.store >= d.dd ? 'Store' : d.uber >= d.dd ? 'Uber' : 'DoorDash'
                const topColor = topChannel === 'Store' ? '#F5C800' : topChannel === 'Uber' ? '#06C167' : '#FF3008'
                return (
                  <tr key={week} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td className="py-2 font-medium" style={{ color: '#555' }}>
                      {new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2 text-right" style={{ color: '#555' }}>{fmtK(d.store)}</td>
                    <td className="py-2 text-right" style={{ color: '#555' }}>{fmtK(d.uber)}</td>
                    <td className="py-2 text-right" style={{ color: '#555' }}>{fmtK(d.dd)}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: '#1A1A1A' }}>{fmtK(total)}</td>
                    <td className="py-2 text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: topColor + '20', color: topColor }}>
                        {topChannel}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
