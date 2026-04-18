'use client'
import { useFilters } from '@/components/FilterContext'

export default function YearlyReportPage() {
  const { filteredData, loading } = useFilters()

  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const byYear: Record<string, any[]> = {}
  filteredData.forEach(d => {
    const year = d.week_start.split('-')[0]
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(d)
  })
  const years = Object.entries(byYear).sort((a, b) => a[0].localeCompare(b[0]))

  const getSummary = (rows: any[]) => {
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
    const totalTx = rows.reduce((s, d) => s + (parseInt(d.transactions_store) || 0) + (parseInt(d.transactions_uber) || 0) + (parseInt(d.transactions_doordash) || 0), 0)
    const months = [...new Set(rows.map(d => d.week_start.substring(0, 7)))].length
    const weeks = [...new Set(rows.map(d => d.week_start))].length
    return { storeRev, uberRev, ddRev, totalRev, costFood, costStaff, costOp, totalCost, profit, margin, totalTx, months, weeks }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Yearly Report</h2>

      {years.map(([year, rows]) => {
        const s = getSummary(rows)

        const byMonth: Record<string, any[]> = {}
        rows.forEach(d => {
          const m = d.week_start.substring(0, 7)
          if (!byMonth[m]) byMonth[m] = []
          byMonth[m].push(d)
        })
        const monthEntries = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]))

        return (
          <div key={year} className="mb-6 rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #e5e5e5' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: '#FFF9E0', borderBottom: '1px solid #e5e5e5' }}>
              <span className="font-bold text-lg" style={{ color: '#1A1A1A' }}>{year}</span>
              <div className="flex gap-6 text-sm">
                <span style={{ color: '#888' }}>Revenue: <span className="font-bold" style={{ color: '#1A1A1A' }}>{fmt(s.totalRev)}</span></span>
                <span style={{ color: '#888' }}>Cost: <span className="font-bold" style={{ color: '#888' }}>{fmt(s.totalCost)}</span></span>
                <span style={{ color: '#888' }}>Profit: <span className="font-bold" style={{ color: s.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(s.profit)} ({s.margin.toFixed(1)}%)</span></span>
              </div>
            </div>

            <div className="p-5">
              {/* Year KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Total Revenue', value: fmt(s.totalRev), color: '#F5C800' },
                  { label: 'Total Cost', value: fmt(s.totalCost), color: '#ef4444' },
                  { label: 'Net Profit', value: fmt(s.profit), color: s.profit >= 0 ? '#16a34a' : '#dc2626' },
                  { label: 'Profit Margin', value: `${s.margin.toFixed(1)}%`, color: s.margin >= 20 ? '#16a34a' : '#d97706' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: '#f9f9f9' }}>
                    <div className="text-xs mb-1" style={{ color: '#888' }}>{label}</div>
                    <div className="font-bold" style={{ color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Monthly breakdown */}
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    {['Month', 'Weeks', 'Revenue', 'Store', 'Uber', 'DoorDash', 'Total Cost', 'Profit', 'Margin', 'Tx'].map(h => (
                      <th key={h} className="text-right first:text-left py-1.5 px-2 font-medium" style={{ color: '#888' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthEntries.map(([month, mRows]) => {
                    const ms = getSummary(mRows)
                    const label = new Date(month + '-01').toLocaleDateString('en-AU', { month: 'long' })
                    return (
                      <tr key={month} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        <td className="py-1.5 px-2 font-medium" style={{ color: '#555' }}>{label}</td>
                        <td className="py-1.5 px-2 text-right" style={{ color: '#888' }}>{ms.weeks}</td>
                        <td className="py-1.5 px-2 text-right font-semibold" style={{ color: '#1A1A1A' }}>{fmt(ms.totalRev)}</td>
                        <td className="py-1.5 px-2 text-right" style={{ color: '#F5C800' }}>{fmt(ms.storeRev)}</td>
                        <td className="py-1.5 px-2 text-right" style={{ color: '#06C167' }}>{fmt(ms.uberRev)}</td>
                        <td className="py-1.5 px-2 text-right" style={{ color: '#FF3008' }}>{fmt(ms.ddRev)}</td>
                        <td className="py-1.5 px-2 text-right" style={{ color: '#888' }}>{fmt(ms.totalCost)}</td>
                        <td className="py-1.5 px-2 text-right font-semibold" style={{ color: ms.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(ms.profit)}</td>
                        <td className="py-1.5 px-2 text-right" style={{ color: ms.margin >= 20 ? '#16a34a' : ms.margin >= 10 ? '#d97706' : '#dc2626' }}>{ms.margin.toFixed(1)}%</td>
                        <td className="py-1.5 px-2 text-right" style={{ color: '#555' }}>{ms.totalTx.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                  <tr style={{ borderTop: '2px solid #e5e5e5', backgroundColor: '#FFF9E0' }}>
                    <td className="py-2 px-2 font-bold" style={{ color: '#1A1A1A' }}>TOTAL {year}</td>
                    <td className="py-2 px-2 text-right font-bold" style={{ color: '#888' }}>{s.weeks}</td>
                    <td className="py-2 px-2 text-right font-bold" style={{ color: '#1A1A1A' }}>{fmt(s.totalRev)}</td>
                    <td className="py-2 px-2 text-right font-bold" style={{ color: '#F5C800' }}>{fmt(s.storeRev)}</td>
                    <td className="py-2 px-2 text-right font-bold" style={{ color: '#06C167' }}>{fmt(s.uberRev)}</td>
                    <td className="py-2 px-2 text-right font-bold" style={{ color: '#FF3008' }}>{fmt(s.ddRev)}</td>
                    <td className="py-2 px-2 text-right font-bold" style={{ color: '#888' }}>{fmt(s.totalCost)}</td>
                    <td className="py-2 px-2 text-right font-bold" style={{ color: s.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(s.profit)}</td>
                    <td className="py-2 px-2 text-right font-bold" style={{ color: s.margin >= 20 ? '#16a34a' : '#d97706' }}>{s.margin.toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right font-bold" style={{ color: '#555' }}>{s.totalTx.toLocaleString()}</td>
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
