'use client'
import { useFilters } from '@/components/FilterContext'

export default function PLPage() {
  const { filteredData, loading } = useFilters()

  const sum = (key: string) => filteredData.reduce((s, d) => s + (parseFloat(d[key]) || 0), 0)
  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const storeRev = sum('revenue_store_net')
  const uberRev = sum('revenue_uber_gross')
  const ddRev = sum('revenue_doordash_gross')
  const grossRev = storeRev + uberRev + ddRev
  const costFood = sum('cost_food')
  const costStaff = sum('cost_staff')
  const costOp = sum('cost_operation')
  const totalCost = costFood + costStaff + costOp
  const grossProfit = grossRev - totalCost
  const profitPct = grossRev > 0 ? (grossProfit / grossRev * 100) : 0
  const totalTx = sum('transactions_store') + sum('transactions_uber') + sum('transactions_doordash')

  const byWeek: Record<string, any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { rev: 0, cost: 0, profit: 0 }
    const rev = (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0)
    const cost = (parseFloat(d.cost_food) || 0) + (parseFloat(d.cost_staff) || 0) + (parseFloat(d.cost_operation) || 0)
    byWeek[w].rev += rev
    byWeek[w].cost += cost
    byWeek[w].profit += rev - cost
  })
  const weeks = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))
  const maxRev = Math.max(...weeks.map(w => w[1].rev), 1)

  const profitWeeks = weeks.filter(w => w[1].profit >= 0).length
  const lossWeeks = weeks.filter(w => w[1].profit < 0).length
  const bestWeek = [...weeks].sort((a, b) => b[1].profit - a[1].profit)[0]
  const worstWeek = [...weeks].sort((a, b) => a[1].profit - b[1].profit)[0]

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>P&L Summary</h2>

      {/* P&L Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Profit & Loss Statement</h3>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#aaa' }}>Revenue</div>
            {[
              { label: 'Physical Store', value: storeRev, indent: true },
              { label: 'Uber Eats', value: uberRev, indent: true },
              { label: 'DoorDash', value: ddRev, indent: true },
              { label: 'Gross Revenue', value: grossRev, bold: true },
            ].map(({ label, value, indent, bold }) => (
              <div key={label} className={`flex justify-between py-1.5 ${indent ? 'pl-4' : ''}`}
                style={{ borderBottom: bold ? '2px solid #e5e5e5' : '1px solid #f5f5f5' }}>
                <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color: bold ? '#1A1A1A' : '#555' }}>{label}</span>
                <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color: bold ? '#1A1A1A' : '#555' }}>{fmt(value)}</span>
              </div>
            ))}

            <div className="text-xs font-semibold uppercase tracking-wide mt-3 mb-2" style={{ color: '#aaa' }}>Costs</div>
            {[
              { label: 'Food Cost', value: costFood, indent: true },
              { label: 'Staff Cost', value: costStaff, indent: true },
              { label: 'Operations', value: costOp, indent: true },
              { label: 'Total Cost', value: totalCost, bold: true },
            ].map(({ label, value, indent, bold }) => (
              <div key={label} className={`flex justify-between py-1.5 ${indent ? 'pl-4' : ''}`}
                style={{ borderBottom: bold ? '2px solid #e5e5e5' : '1px solid #f5f5f5' }}>
                <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color: bold ? '#1A1A1A' : '#555' }}>{label}</span>
                <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color: bold ? '#ef4444' : '#555' }}>({fmt(value)})</span>
              </div>
            ))}

            <div className="flex justify-between py-3 px-3 rounded-xl mt-2"
              style={{ backgroundColor: grossProfit >= 0 ? '#f0fdf4' : '#fff0f0' }}>
              <span className="font-bold" style={{ color: '#1A1A1A' }}>Net Profit</span>
              <div className="text-right">
                <div className="font-bold" style={{ color: grossProfit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(grossProfit)}</div>
                <div className="text-xs" style={{ color: '#aaa' }}>{profitPct.toFixed(1)}% margin</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI boxes */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Profitable Weeks', value: profitWeeks, color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Loss Weeks', value: lossWeeks, color: '#dc2626', bg: '#fff0f0' },
              { label: 'Avg Weekly Profit', value: fmtK(weeks.length > 0 ? grossProfit / weeks.length : 0), color: '#1A1A1A', bg: '#f9f9f9' },
              { label: 'Profit per Order', value: fmt(totalTx > 0 ? grossProfit / totalTx : 0), color: '#1A1A1A', bg: '#f9f9f9' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-2xl p-4" style={{ backgroundColor: bg, border: '1px solid #e5e5e5' }}>
                <div className="text-xs mb-1" style={{ color: '#888' }}>{label}</div>
                <div className="text-2xl font-bold" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          {bestWeek && (
            <div className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #e5e5e5' }}>
              <div className="text-xs mb-2 font-semibold" style={{ color: '#888' }}>BEST WEEK</div>
              <div className="flex justify-between">
                <span style={{ color: '#555' }}>{new Date(bestWeek[0]).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}</span>
                <span className="font-bold" style={{ color: '#16a34a' }}>{fmt(bestWeek[1].profit)}</span>
              </div>
            </div>
          )}
          {worstWeek && (
            <div className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #e5e5e5' }}>
              <div className="text-xs mb-2 font-semibold" style={{ color: '#888' }}>WORST WEEK</div>
              <div className="flex justify-between">
                <span style={{ color: '#555' }}>{new Date(worstWeek[0]).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}</span>
                <span className="font-bold" style={{ color: '#dc2626' }}>{fmt(worstWeek[1].profit)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly P&L table */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Weekly P&L</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th className="text-left py-2 font-medium" style={{ color: '#888' }}>Week</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Revenue</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Cost</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Profit</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Margin</th>
                <th className="py-2 pl-4 w-40" style={{ color: '#888' }}>Revenue vs Cost</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map(([week, d]) => {
                const margin = d.rev > 0 ? (d.profit / d.rev * 100) : 0
                const revPct = d.rev / maxRev * 100
                const costPct = d.rev > 0 ? (d.cost / d.rev * 100) : 0
                return (
                  <tr key={week} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td className="py-2 font-medium" style={{ color: '#555' }}>
                      {new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2 text-right font-semibold" style={{ color: '#1A1A1A' }}>{fmtK(d.rev)}</td>
                    <td className="py-2 text-right" style={{ color: '#888' }}>{fmtK(d.cost)}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: d.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmtK(d.profit)}</td>
                    <td className="py-2 text-right" style={{ color: margin >= 20 ? '#16a34a' : margin >= 10 ? '#d97706' : '#dc2626' }}>
                      {margin.toFixed(1)}%
                    </td>
                    <td className="py-2 pl-4">
                      <div className="relative h-4 rounded-full overflow-hidden" style={{ backgroundColor: '#f0f0f0' }}>
                        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${revPct}%`, backgroundColor: '#22c55e', opacity: 0.3 }} />
                        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(costPct, 100)}%`, backgroundColor: '#ef4444', opacity: 0.6 }} />
                      </div>
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
