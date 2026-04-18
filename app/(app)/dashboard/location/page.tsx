'use client'
import { useFilters } from '@/components/FilterContext'

export default function LocationPage() {
  const { filteredData, restaurants, loading } = useFilters()

  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const locationNames = [...new Set(restaurants.map((r: any) => r.report_locations?.name).filter(Boolean))]

  const getLocData = (locName: string) => {
    const d = filteredData.filter(d => d.report_restaurants?.report_locations?.name === locName)
    const storeRev = d.reduce((s, x) => s + (parseFloat(x.revenue_store_net) || 0), 0)
    const uberRev = d.reduce((s, x) => s + (parseFloat(x.revenue_uber_gross) || 0), 0)
    const ddRev = d.reduce((s, x) => s + (parseFloat(x.revenue_doordash_gross) || 0), 0)
    const totalRev = storeRev + uberRev + ddRev
    const costFood = d.reduce((s, x) => s + (parseFloat(x.cost_food) || 0), 0)
    const costStaff = d.reduce((s, x) => s + (parseFloat(x.cost_staff) || 0), 0)
    const costOp = d.reduce((s, x) => s + (parseFloat(x.cost_operation) || 0), 0)
    const totalCost = costFood + costStaff + costOp
    const profit = totalRev - totalCost
    const margin = totalRev > 0 ? (profit / totalRev * 100) : 0
    const tx = d.reduce((s, x) => s + (parseInt(x.transactions_store) || 0) + (parseInt(x.transactions_uber) || 0) + (parseInt(x.transactions_doordash) || 0), 0)

    // By restaurant
    const restNames = [...new Set(d.map(x => x.report_restaurants?.name).filter(Boolean))]
    const byRest = restNames.map(rName => {
      const rd = d.filter(x => x.report_restaurants?.name === rName)
      const rRev = rd.reduce((s, x) => s + (parseFloat(x.revenue_store_net) || 0) + (parseFloat(x.revenue_uber_gross) || 0) + (parseFloat(x.revenue_doordash_gross) || 0), 0)
      const rCost = rd.reduce((s, x) => s + (parseFloat(x.cost_food) || 0) + (parseFloat(x.cost_staff) || 0) + (parseFloat(x.cost_operation) || 0), 0)
      const rProfit = rRev - rCost
      const brand = restaurants.find((r: any) => r.name === rName)?.brand || 'angies'
      return { name: rName, rev: rRev, cost: rCost, profit: rProfit, margin: rRev > 0 ? rProfit/rRev*100 : 0, brand }
    })

    return { totalRev, storeRev, uberRev, ddRev, totalCost, costFood, costStaff, costOp, profit, margin, tx, byRest }
  }

  const totalRev = filteredData.reduce((s, d) => s + (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0), 0)

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Location Wise Analysis</h2>

      {/* Location comparison cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {locationNames.map(loc => {
          const d = getLocData(loc)
          const share = totalRev > 0 ? (d.totalRev / totalRev * 100) : 0
          return (
            <div key={loc} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold" style={{ color: '#1A1A1A' }}>{loc}</h3>
                <span className="text-xs px-2 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: d.profit >= 0 ? '#dcfce7' : '#fee2e2', color: d.profit >= 0 ? '#16a34a' : '#dc2626' }}>
                  {d.margin.toFixed(1)}% margin
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#888' }}>Revenue</span>
                  <span className="font-bold" style={{ color: '#1A1A1A' }}>{fmt(d.totalRev)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#888' }}>Cost</span>
                  <span style={{ color: '#888' }}>{fmt(d.totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#888' }}>Profit</span>
                  <span style={{ color: d.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(d.profit)}</span>
                </div>
              </div>

              {/* Share bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: '#aaa' }}>
                  <span>Revenue Share</span>
                  <span>{share.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                  <div className="h-2 rounded-full" style={{ width: `${share}%`, backgroundColor: '#F5C800' }} />
                </div>
              </div>

              {/* Channel breakdown */}
              <div className="space-y-1.5">
                {[
                  { label: 'Store', value: d.storeRev, color: '#F5C800' },
                  { label: 'Uber', value: d.uberRev, color: '#06C167' },
                  { label: 'DoorDash', value: d.ddRev, color: '#FF3008' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span style={{ color: '#888' }}>{label}</span>
                    </div>
                    <span style={{ color: '#555' }}>{fmtK(value)}</span>
                  </div>
                ))}
              </div>

              {/* Restaurants */}
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #f0f0f0' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: '#888' }}>BY RESTAURANT</div>
                {d.byRest.map(r => (
                  <div key={r.name} className="flex justify-between text-xs py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: r.brand === 'angies' ? '#F5C800' : '#22c55e' }} />
                      <span style={{ color: '#555' }}>{r.name.replace(loc, '').trim()}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold" style={{ color: '#1A1A1A' }}>{fmtK(r.rev)}</span>
                      <span className="ml-1" style={{ color: r.profit >= 0 ? '#16a34a' : '#dc2626' }}>({r.margin.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison table */}
      <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Location Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                {['Location', 'Revenue', 'Cost', 'Profit', 'Margin', 'Transactions', 'Avg/Order'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 font-medium" style={{ color: '#888' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locationNames.map(loc => {
                const d = getLocData(loc)
                const avgOrder = d.tx > 0 ? d.totalRev / d.tx : 0
                return (
                  <tr key={loc} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td className="py-3 pr-4 font-semibold" style={{ color: '#1A1A1A' }}>{loc}</td>
                    <td className="py-3 pr-4" style={{ color: '#1A1A1A' }}>{fmt(d.totalRev)}</td>
                    <td className="py-3 pr-4" style={{ color: '#888' }}>{fmt(d.totalCost)}</td>
                    <td className="py-3 pr-4 font-semibold" style={{ color: d.profit >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(d.profit)}</td>
                    <td className="py-3 pr-4" style={{ color: d.margin >= 20 ? '#16a34a' : d.margin >= 10 ? '#d97706' : '#dc2626' }}>
                      {d.margin.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-4" style={{ color: '#555' }}>{d.tx.toLocaleString()}</td>
                    <td className="py-3" style={{ color: '#555' }}>{fmt(avgOrder)}</td>
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
