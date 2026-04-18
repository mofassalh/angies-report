'use client'
import { useFilters } from '@/components/FilterContext'
import { ShoppingBag, Users, Settings, TrendingDown } from 'lucide-react'

export default function CostPage() {
  const { filteredData, loading } = useFilters()

  const sum = (key: string) => filteredData.reduce((s, d) => s + (parseFloat(d[key]) || 0), 0)
  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const costFood = sum('cost_food')
  const costStaff = sum('cost_staff')
  const costOp = sum('cost_operation')
  const totalCost = costFood + costStaff + costOp
  const totalRev = sum('revenue_store_net') + sum('revenue_uber_gross') + sum('revenue_doordash_gross')
  const totalTx = sum('transactions_store') + sum('transactions_uber') + sum('transactions_doordash')

  const byWeek: Record<string, any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { food: 0, staff: 0, op: 0, total: 0, rev: 0 }
    byWeek[w].food += parseFloat(d.cost_food) || 0
    byWeek[w].staff += parseFloat(d.cost_staff) || 0
    byWeek[w].op += parseFloat(d.cost_operation) || 0
    byWeek[w].total += (parseFloat(d.cost_food) || 0) + (parseFloat(d.cost_staff) || 0) + (parseFloat(d.cost_operation) || 0)
    byWeek[w].rev += (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0)
  })
  const weeks = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))
  const maxCost = Math.max(...weeks.map(w => w[1].total), 1)

  const costs = [
    { label: 'Food Cost', value: costFood, color: '#f97316', icon: ShoppingBag },
    { label: 'Staff Cost', value: costStaff, color: '#8b5cf6', icon: Users },
    { label: 'Operations', value: costOp, color: '#4a9eff', icon: Settings },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Cost Analysis</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Cost', value: fmt(totalCost), sub: 'All cost types', color: '#ef4444', bg: '#fff0f0', icon: TrendingDown },
          { label: 'Food Cost', value: fmt(costFood), sub: `${totalRev > 0 ? (costFood/totalRev*100).toFixed(1) : 0}% of revenue`, color: '#f97316', bg: '#fff7ed', icon: ShoppingBag },
          { label: 'Staff Cost', value: fmt(costStaff), sub: `${totalRev > 0 ? (costStaff/totalRev*100).toFixed(1) : 0}% of revenue`, color: '#8b5cf6', bg: '#f5f3ff', icon: Users },
          { label: 'Operations', value: fmt(costOp), sub: `${totalRev > 0 ? (costOp/totalRev*100).toFixed(1) : 0}% of revenue`, color: '#4a9eff', bg: '#f0f8ff', icon: Settings },
        ].map(({ label, value, sub, color, bg, icon: Icon }) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cost breakdown bars */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Cost Breakdown</h3>
          <div className="space-y-4">
            {costs.map(({ label, value, color }) => {
              const pct = totalCost > 0 ? (value / totalCost * 100) : 0
              const revPct = totalRev > 0 ? (value / totalRev * 100) : 0
              const perTx = totalTx > 0 ? value / totalTx : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: '#555' }}>{label}</span>
                    <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmt(value)}</span>
                  </div>
                  <div className="h-3 rounded-full mb-1" style={{ backgroundColor: '#f0f0f0' }}>
                    <div className="h-3 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: '#aaa' }}>
                    <span>{pct.toFixed(1)}% of total cost</span>
                    <span>{revPct.toFixed(1)}% of revenue · {fmt(perTx)}/order</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cost vs Revenue */}
        <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
          <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Cost vs Revenue Ratio</h3>
          <div className="space-y-3">
            {[
              { label: 'Revenue', value: totalRev, color: '#22c55e' },
              { label: 'Total Cost', value: totalCost, color: '#ef4444' },
              { label: 'Gross Profit', value: totalRev - totalCost, color: '#F5C800' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#f9f9f9' }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm" style={{ color: '#555' }}>{label}</span>
                </div>
                <span className="font-bold text-sm" style={{ color: value >= 0 ? '#1A1A1A' : '#ef4444' }}>{fmt(value)}</span>
              </div>
            ))}
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: '#FFF9E0' }}>
              <span className="text-xs" style={{ color: '#888' }}>Cost Ratio: </span>
              <span className="font-bold" style={{ color: '#b8860b' }}>{totalRev > 0 ? (totalCost/totalRev*100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly cost chart */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Weekly Cost Trend</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th className="text-left py-2 font-medium" style={{ color: '#888' }}>Week</th>
                <th className="text-right py-2 font-medium" style={{ color: '#f97316' }}>Food</th>
                <th className="text-right py-2 font-medium" style={{ color: '#8b5cf6' }}>Staff</th>
                <th className="text-right py-2 font-medium" style={{ color: '#4a9eff' }}>Ops</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Total</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>% of Rev</th>
                <th className="py-2 pl-4 w-32" style={{ color: '#888' }}>Bar</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map(([week, d]) => {
                const revPct = d.rev > 0 ? (d.total / d.rev * 100) : 0
                const barPct = d.total / maxCost * 100
                return (
                  <tr key={week} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td className="py-2 font-medium" style={{ color: '#555' }}>
                      {new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2 text-right" style={{ color: '#f97316' }}>{fmtK(d.food)}</td>
                    <td className="py-2 text-right" style={{ color: '#8b5cf6' }}>{fmtK(d.staff)}</td>
                    <td className="py-2 text-right" style={{ color: '#4a9eff' }}>{fmtK(d.op)}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: '#1A1A1A' }}>{fmtK(d.total)}</td>
                    <td className="py-2 text-right" style={{ color: revPct > 80 ? '#ef4444' : revPct > 60 ? '#d97706' : '#16a34a' }}>
                      {revPct.toFixed(1)}%
                    </td>
                    <td className="py-2 pl-4">
                      <div className="h-3 rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                        <div className="h-3 rounded-full" style={{ width: `${barPct}%`, backgroundColor: '#ef4444' }} />
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
