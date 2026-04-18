'use client'
import { useFilters } from '@/components/FilterContext'

export default function TransactionsPage() {
  const { filteredData, loading } = useFilters()

  const fmt = (n: number) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const storeTx = filteredData.reduce((s, d) => s + (parseInt(d.transactions_store) || 0), 0)
  const uberTx = filteredData.reduce((s, d) => s + (parseInt(d.transactions_uber) || 0), 0)
  const ddTx = filteredData.reduce((s, d) => s + (parseInt(d.transactions_doordash) || 0), 0)
  const totalTx = storeTx + uberTx + ddTx
  const storeRev = filteredData.reduce((s, d) => s + (parseFloat(d.revenue_store_net) || 0), 0)
  const uberRev = filteredData.reduce((s, d) => s + (parseFloat(d.revenue_uber_gross) || 0), 0)
  const ddRev = filteredData.reduce((s, d) => s + (parseFloat(d.revenue_doordash_gross) || 0), 0)
  const totalRev = storeRev + uberRev + ddRev

  const byWeek: Record<string, any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { store: 0, uber: 0, dd: 0, total: 0, rev: 0 }
    byWeek[w].store += parseInt(d.transactions_store) || 0
    byWeek[w].uber += parseInt(d.transactions_uber) || 0
    byWeek[w].dd += parseInt(d.transactions_doordash) || 0
    byWeek[w].total += (parseInt(d.transactions_store) || 0) + (parseInt(d.transactions_uber) || 0) + (parseInt(d.transactions_doordash) || 0)
    byWeek[w].rev += (parseFloat(d.revenue_store_net) || 0) + (parseFloat(d.revenue_uber_gross) || 0) + (parseFloat(d.revenue_doordash_gross) || 0)
  })
  const weeks = Object.entries(byWeek).sort((a, b) => a[0].localeCompare(b[0]))
  const maxTx = Math.max(...weeks.map(w => w[1].total), 1)

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Transaction Analysis</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Transactions', value: totalTx.toLocaleString(), sub: 'All channels' },
          { label: 'Store Orders', value: storeTx.toLocaleString(), sub: `Avg ${fmt(storeTx > 0 ? storeRev/storeTx : 0)}/order` },
          { label: 'Uber Orders', value: uberTx.toLocaleString(), sub: `Avg ${fmt(uberTx > 0 ? uberRev/uberTx : 0)}/order` },
          { label: 'DoorDash Orders', value: ddTx.toLocaleString(), sub: `Avg ${fmt(ddTx > 0 ? ddRev/ddTx : 0)}/order` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
            <div className="text-xs font-medium mb-2" style={{ color: '#888' }}>{label}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: '#1A1A1A' }}>{loading ? '—' : value}</div>
            <div className="text-xs" style={{ color: '#aaa' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 bg-white mb-6" style={{ border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Transaction Share by Channel</h3>
        <div className="space-y-3">
          {[
            { label: 'Physical Store', tx: storeTx, color: '#F5C800' },
            { label: 'Uber Eats', tx: uberTx, color: '#06C167' },
            { label: 'DoorDash', tx: ddTx, color: '#FF3008' },
          ].map(({ label, tx, color }) => {
            const pct = totalTx > 0 ? (tx / totalTx * 100) : 0
            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#555' }}>{label}</span>
                  <span className="font-semibold" style={{ color: '#1A1A1A' }}>{tx.toLocaleString()} <span className="text-xs font-normal" style={{ color: '#aaa' }}>({pct.toFixed(1)}%)</span></span>
                </div>
                <div className="h-3 rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                  <div className="h-3 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl p-5 bg-white" style={{ border: '1px solid #e5e5e5' }}>
        <h3 className="font-semibold mb-4" style={{ color: '#1A1A1A' }}>Weekly Transaction Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <th className="text-left py-2 font-medium" style={{ color: '#888' }}>Week</th>
                <th className="text-right py-2 font-medium" style={{ color: '#F5C800' }}>Store</th>
                <th className="text-right py-2 font-medium" style={{ color: '#06C167' }}>Uber</th>
                <th className="text-right py-2 font-medium" style={{ color: '#FF3008' }}>DoorDash</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Total</th>
                <th className="text-right py-2 font-medium" style={{ color: '#888' }}>Avg/Order</th>
                <th className="py-2 pl-4 w-32" style={{ color: '#888' }}>Bar</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map(([week, d]) => {
                const avgOrder = d.total > 0 ? d.rev / d.total : 0
                return (
                  <tr key={week} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td className="py-2 font-medium" style={{ color: '#555' }}>
                      {new Date(week).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2 text-right" style={{ color: '#555' }}>{d.store}</td>
                    <td className="py-2 text-right" style={{ color: '#555' }}>{d.uber}</td>
                    <td className="py-2 text-right" style={{ color: '#555' }}>{d.dd}</td>
                    <td className="py-2 text-right font-semibold" style={{ color: '#1A1A1A' }}>{d.total}</td>
                    <td className="py-2 text-right" style={{ color: '#555' }}>{fmt(avgOrder)}</td>
                    <td className="py-2 pl-4">
                      <div className="h-3 rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                        <div className="h-3 rounded-full" style={{ width: `${d.total/maxTx*100}%`, backgroundColor: '#4a9eff' }} />
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
