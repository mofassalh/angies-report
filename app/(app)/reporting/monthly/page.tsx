'use client'
import { useFilters } from '@/components/FilterContext'

export default function MonthlyReportPage() {
  const { filteredData, loading } = useFilters()

  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const byMonth: Record<string, any[]> = {}
  filteredData.forEach(d => {
    const date = new Date(d.week_start)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(d)
  })
  const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]))

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
    const weeks = [...new Set(rows.map(d => d.week_start))].length
    return { storeRev, uberRev, ddRev, totalRev, costFood, costStaff, costOp, totalCost, profit, margin, totalTx, weeks }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Monthly Report</h2>

      {/* Monthly summary table */}
      <div className="rounded-2xl bg-white overflow-hidden mb-6" style={{ border: '1px solid #e5e5e5' }}>
        <div className="px-5 py-3" style={{ backgroundColor: '#FFF9E0', borderBottom: '1px solid #e5e5e5' }}>
          <h3 className="font-bold" style={{ color: '#1A1A1A' }}>Monthly Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                {['Month', 'Weeks', 'Store Rev', 'Uber Rev', 'DD Rev', 'Total Rev', 'Total Cost', 'Food', 'Staff', 'Ops', 'Profit', 'Margin', 'Transactions'].map(h => (
                  <th key={h} className="text-right first:text-left py-2 px-3 font-medium text-xs" style={{ color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {months.map(([month, rows]) => {
                const s = getSummary(rows)
                const label = new Date(month + '-01').toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
                return (
                  <tr key={month} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td className="py-2.5 px-3 font-semibold" style={{ color: '#1A1A1A' }}>{label}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: '#888' }}>{s.weeks}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: '#F5C800' }}>{fmt(s.storeRev)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: '#06C167' }}>{fmt(s.uberRev)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: '#FF3008' }}>{fmt(s.ddRev)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold" style={{ color: '#1A1A1A' }}>{fmt(s.totalRev)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: '#888' }}>{fmt(s.totalCost)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: '#f97316' }}>{fmt(s.costFood)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: '#8b5cf6' }}>{fmt(s.costStaff)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: '#4a9eff' }}>{fmt(s.costOp)}</td>
                    <td className="py-2.5 px-3 text-right font-semibold" style={{ color: s.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(s.profit)}</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: s.margin >= 20 ? '#16a34a' : s.margin >= 10 ? '#d97706' : '#dc2626' }}>{s.margin.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right" style={{ color: '#555' }}>{s.totalTx.toLocaleString()}</td>
                  </tr>
                )
              })}
              {/* Total */}
              {months.length > 1 && (() => {
                const all = getSummary(filteredData)
                return (
                  <tr style={{ borderTop: '2px solid #e5e5e5', backgroundColor: '#FFF9E0' }}>
                    <td className="py-2.5 px-3 font-bold" style={{ color: '#1A1A1A' }}>TOTAL</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#888' }}>{all.weeks}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#F5C800' }}>{fmt(all.storeRev)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#06C167' }}>{fmt(all.uberRev)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#FF3008' }}>{fmt(all.ddRev)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#1A1A1A' }}>{fmt(all.totalRev)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#888' }}>{fmt(all.totalCost)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#f97316' }}>{fmt(all.costFood)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#8b5cf6' }}>{fmt(all.costStaff)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#4a9eff' }}>{fmt(all.costOp)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: all.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(all.profit)}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: all.margin >= 20 ? '#16a34a' : '#d97706' }}>{all.margin.toFixed(1)}%</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#555' }}>{all.totalTx.toLocaleString()}</td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
