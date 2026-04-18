'use client'
import { useFilters } from '@/components/FilterContext'

export default function WeeklyReportPage() {
  const { filteredData, restaurants, loading } = useFilters()

  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const byWeek: Record<string, any[]> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = []
    byWeek[w].push(d)
  })
  const weeks = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))

  const getWeekSummary = (rows: any[]) => {
    const storeRev = rows.reduce((s, d) => s + (parseFloat(d.revenue_store_net) || 0), 0)
    const uberRev = rows.reduce((s, d) => s + (parseFloat(d.revenue_uber_gross) || 0), 0)
    const ddRev = rows.reduce((s, d) => s + (parseFloat(d.revenue_doordash_gross) || 0), 0)
    const totalRev = storeRev + uberRev + ddRev
    const costFood = rows.reduce((s, d) => s + (parseFloat(d.cost_food) || 0), 0)
    const costStaff = rows.reduce((s, d) => s + (parseFloat(d.cost_staff) || 0), 0)
    const costOp = rows.reduce((s, d) => s + (parseFloat(d.cost_operation) || 0), 0)
    const totalCost = costFood + costStaff + costOp
    const profit = totalRev - totalCost
    const margin = totalRev > 0 ? (profit / totalRev * 100) : 0
    const storeTx = rows.reduce((s, d) => s + (parseInt(d.transactions_store) || 0), 0)
    const uberTx = rows.reduce((s, d) => s + (parseInt(d.transactions_uber) || 0), 0)
    const ddTx = rows.reduce((s, d) => s + (parseInt(d.transactions_doordash) || 0), 0)
    const totalTx = storeTx + uberTx + ddTx
    return { storeRev, uberRev, ddRev, totalRev, costFood, costStaff, costOp, totalCost, profit, margin, storeTx, uberTx, ddTx, totalTx }
  }

  const restaurantNames = [...new Set(filteredData.map(d => d.report_restaurants?.name).filter(Boolean))]

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Weekly Report</h2>

      {weeks.map(([week, rows]) => {
        const s = getWeekSummary(rows)
        return (
          <div key={week} className="mb-6 rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
            {/* Week header */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: '#FFF9E0', borderBottom: '1px solid #e5e5e5' }}>
              <div>
                <span className="font-bold" style={{ color: '#1A1A1A' }}>
                  Week of {new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex gap-4 text-sm">
                <span style={{ color: '#888' }}>Revenue: <span className="font-bold" style={{ color: '#1A1A1A' }}>{fmt(s.totalRev)}</span></span>
                <span style={{ color: '#888' }}>Profit: <span className="font-bold" style={{ color: s.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(s.profit)} ({s.margin.toFixed(1)}%)</span></span>
              </div>
            </div>

            <div className="p-5">
              {/* Summary row */}
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {[
                  { label: 'Store Rev', value: fmt(s.storeRev), color: '#F5C800' },
                  { label: 'Uber Rev', value: fmt(s.uberRev), color: '#06C167' },
                  { label: 'DoorDash Rev', value: fmt(s.ddRev), color: '#FF3008' },
                  { label: 'Food Cost', value: fmt(s.costFood), color: '#f97316' },
                  { label: 'Staff Cost', value: fmt(s.costStaff), color: '#8b5cf6' },
                  { label: 'Operations', value: fmt(s.costOp), color: '#4a9eff' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: '#f9f9f9' }}>
                    <div className="text-xs mb-1" style={{ color: '#888' }}>{label}</div>
                    <div className="text-sm font-bold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Restaurant breakdown */}
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <th className="text-left py-1.5 font-medium" style={{ color: '#888' }}>Restaurant</th>
                    <th className="text-right py-1.5 font-medium" style={{ color: '#888' }}>Store Tx</th>
                    <th className="text-right py-1.5 font-medium" style={{ color: '#888' }}>Store Rev</th>
                    <th className="text-right py-1.5 font-medium" style={{ color: '#888' }}>Uber Tx</th>
                    <th className="text-right py-1.5 font-medium" style={{ color: '#888' }}>Uber Rev</th>
                    <th className="text-right py-1.5 font-medium" style={{ color: '#888' }}>DD Tx</th>
                    <th className="text-right py-1.5 font-medium" style={{ color: '#888' }}>DD Rev</th>
                    <th className="text-right py-1.5 font-medium" style={{ color: '#888' }}>Total Rev</th>
                    <th className="text-right py-1.5 font-medium" style={{ color: '#888' }}>Total Cost</th>
                    <th className="text-right py-1.5 font-medium" style={{ color: '#888' }}>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(d => {
                    const rev = (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0)
                    const cost = (parseFloat(d.cost_food) || 0) + (parseFloat(d.cost_staff) || 0) + (parseFloat(d.cost_operation) || 0)
                    const profit = rev - cost
                    return (
                      <tr key={d.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        <td className="py-1.5 font-medium" style={{ color: '#555' }}>{d.report_restaurants?.name}</td>
                        <td className="py-1.5 text-right" style={{ color: '#555' }}>{d.transactions_store || 0}</td>
                        <td className="py-1.5 text-right" style={{ color: '#F5C800' }}>{fmt(parseFloat(d.revenue_store_net) || 0)}</td>
                        <td className="py-1.5 text-right" style={{ color: '#555' }}>{d.transactions_uber || 0}</td>
                        <td className="py-1.5 text-right" style={{ color: '#06C167' }}>{fmt(parseFloat(d.revenue_uber_gross) || 0)}</td>
                        <td className="py-1.5 text-right" style={{ color: '#555' }}>{d.transactions_doordash || 0}</td>
                        <td className="py-1.5 text-right" style={{ color: '#FF3008' }}>{fmt(parseFloat(d.revenue_doordash_gross) || 0)}</td>
                        <td className="py-1.5 text-right font-semibold" style={{ color: '#1A1A1A' }}>{fmt(rev)}</td>
                        <td className="py-1.5 text-right" style={{ color: '#888' }}>{fmt(cost)}</td>
                        <td className="py-1.5 text-right font-semibold" style={{ color: profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(profit)}</td>
                      </tr>
                    )
                  })}
                  {/* Total row */}
                  <tr style={{ borderTop: '2px solid #e5e5e5' }}>
                    <td className="py-2 font-bold" style={{ color: '#1A1A1A' }}>TOTAL</td>
                    <td className="py-2 text-right font-bold" style={{ color: '#1A1A1A' }}>{s.storeTx}</td>
                    <td className="py-2 text-right font-bold" style={{ color: '#1A1A1A' }}>{fmt(s.storeRev)}</td>
                    <td className="py-2 text-right font-bold" style={{ color: '#1A1A1A' }}>{s.uberTx}</td>
                    <td className="py-2 text-right font-bold" style={{ color: '#1A1A1A' }}>{fmt(s.uberRev)}</td>
                    <td className="py-2 text-right font-bold" style={{ color: '#1A1A1A' }}>{s.ddTx}</td>
                    <td className="py-2 text-right font-bold" style={{ color: '#1A1A1A' }}>{fmt(s.ddRev)}</td>
                    <td className="py-2 text-right font-bold" style={{ color: '#1A1A1A' }}>{fmt(s.totalRev)}</td>
                    <td className="py-2 text-right font-bold" style={{ color: '#888' }}>{fmt(s.totalCost)}</td>
                    <td className="py-2 text-right font-bold" style={{ color: s.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(s.profit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
