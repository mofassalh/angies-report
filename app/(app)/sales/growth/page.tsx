'use client'
import { useFilters } from '@/components/FilterContext'

export default function GrowthPage() {
  const { filteredData, loading } = useFilters()

  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const byWeek: Record<string, any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { rev: 0, cost: 0, tx: 0 }
    byWeek[w].rev += (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0)
    byWeek[w].cost += (parseFloat(d.cost_food) || 0) + (parseFloat(d.cost_staff) || 0) + (parseFloat(d.cost_operation) || 0)
    byWeek[w].tx += (parseInt(d.transactions_store) || 0) + (parseInt(d.transactions_uber) || 0) + (parseInt(d.transactions_doordash) || 0)
  })
  const weeks = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))

  const withGrowth = weeks.map(([week, d], i) => {
    const prev = weeks[i - 1]?.[1]
    const revGrowth = prev && prev.rev > 0 ? ((d.rev - prev.rev) / prev.rev * 100) : null
    const txGrowth = prev && prev.tx > 0 ? ((d.tx - prev.tx) / prev.tx * 100) : null
    const profit = d.rev - d.cost
    const margin = d.rev > 0 ? (profit / d.rev * 100) : 0
    return { week, ...d, profit, margin, revGrowth, txGrowth }
  })

  const avgRevGrowth = withGrowth.filter(w => w.revGrowth !== null).reduce((s, w) => s + w.revGrowth!, 0) / Math.max(withGrowth.filter(w => w.revGrowth !== null).length, 1)
  const avgMargin = withGrowth.reduce((s, w) => s + w.margin, 0) / Math.max(withGrowth.length, 1)
  const bestGrowthWeek = [...withGrowth].filter(w => w.revGrowth !== null).sort((a, b) => b.revGrowth! - a.revGrowth!)[0]
  const worstGrowthWeek = [...withGrowth].filter(w => w.revGrowth !== null).sort((a, b) => a.revGrowth! - b.revGrowth!)[0]

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Growth Trends</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Avg Weekly Growth', value: `${avgRevGrowth >= 0 ? '+' : ''}${avgRevGrowth.toFixed(1)}%`, color: avgRevGrowth >= 0 ? '#16a34a' : '#dc2626' },
          { label: 'Avg Profit Margin', value: `${avgMargin.toFixed(1)}%`, color: avgMargin >= 20 ? '#16a34a' : avgMargin >= 10 ? '#d97706' : '#dc2626' },
          { label: 'Best Growth Week', value: bestGrowthWeek ? `+${bestGrowthWeek.revGrowth!.toFixed(1)}%` : '—', color: '#16a34a' },
          { label: 'Worst Growth Week', value: worstGrowthWeek ? `${worstGrowthWeek.revGrowth!.toFixed(1)}%` : '—', color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#888' }}>{label}</div>
            <div className="text-2xl font-bold" style={{ color }}>{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Week over Week Growth</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th className="text-left py-2 font-medium" style={{ color: '#888' }}>Week</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Revenue</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Rev Growth</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Transactions</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Tx Growth</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Profit</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {withGrowth.map(({ week, rev, tx, profit, margin, revGrowth, txGrowth }) => (
                <tr key={week} style={{ borderBottom: '1px solid #f9f9f9' }}>
                  <td className="py-2 font-medium" style={{ color: '#555' }}>
                    {new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-2 text-right font-semibold" style={{ color: '#1A1A1A' }}>{fmt(rev)}</td>
                  <td className="py-2 text-right font-semibold" style={{ color: revGrowth === null ? '#aaa' : revGrowth >= 0 ? '#16a34a' : '#dc2626' }}>
                    {revGrowth === null ? '—' : `${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(1)}%`}
                  </td>
                  <td className="py-2 text-right" style={{ color: '#555' }}>{tx.toLocaleString()}</td>
                  <td className="py-2 text-right" style={{ color: txGrowth === null ? '#aaa' : txGrowth >= 0 ? '#16a34a' : '#dc2626' }}>
                    {txGrowth === null ? '—' : `${txGrowth >= 0 ? '+' : ''}${txGrowth.toFixed(1)}%`}
                  </td>
                  <td className="py-2 text-right font-semibold" style={{ color: profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(profit)}</td>
                  <td className="py-2 text-right" style={{ color: margin >= 20 ? '#16a34a' : margin >= 10 ? '#d97706' : '#dc2626' }}>
                    {margin.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
