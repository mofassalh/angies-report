'use client'
import { useFilters } from '@/components/FilterContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'

export default function LocationPage() {
  const { filteredData, restaurants, loading } = useFilters()

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-AU')}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const locationNames = [...new Set(restaurants.map((r: any) => r.report_locations?.name).filter(Boolean))] as string[]

  const getLocData = (locName: string) => {
    const d = filteredData.filter(d => d.report_restaurants?.report_locations?.name === locName)
    const storeRev = d.reduce((s,x)=>s+(parseFloat(x.revenue_store_net)||0),0)
    const uberRev = d.reduce((s,x)=>s+(parseFloat(x.revenue_uber_gross)||0),0)
    const ddRev = d.reduce((s,x)=>s+(parseFloat(x.revenue_doordash_gross)||0),0)
    const totalRev = storeRev+uberRev+ddRev
    const totalCost = d.reduce((s,x)=>s+(parseFloat(x.cost_food)||0)+(parseFloat(x.cost_staff)||0)+(parseFloat(x.cost_operation)||0),0)
    const profit = totalRev-totalCost
    const margin = totalRev>0?(profit/totalRev*100):0
    const tx = d.reduce((s,x)=>s+(parseInt(x.transactions_store)||0)+(parseInt(x.transactions_uber)||0)+(parseInt(x.transactions_doordash)||0),0)
    return { totalRev, storeRev, uberRev, ddRev, totalCost, profit, margin, tx }
  }

  const totalRev = filteredData.reduce((s,d)=>s+(parseFloat(d.revenue_store_net)||0)+(parseFloat(d.revenue_uber_gross)||0)+(parseFloat(d.revenue_doordash_gross)||0),0)

  const comparisonData = locationNames.map(loc => {
    const d = getLocData(loc)
    return {
      name: loc.split(' ')[0],
      fullName: loc,
      revenue: Math.round(d.totalRev),
      cost: Math.round(d.totalCost),
      profit: Math.round(d.profit),
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:'#fff', border:'0.5px solid #e0e0e0', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
        <div style={{ fontWeight:600, marginBottom:4, color:'#1A1A1A' }}>{label}</div>
        {payload.map((p: any) => <div key={p.name} style={{ color:p.color||p.fill }}>{p.name}: {fmtK(p.value)}</div>)}
      </div>
    )
  }

  const card = (children: React.ReactNode) => (
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:20 }}>{children}</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Location Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
        {locationNames.map(loc => {
          const d = getLocData(loc)
          const share = totalRev > 0 ? (d.totalRev/totalRev*100) : 0
          return (
            <div key={loc} style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <span style={{ fontWeight:600, fontSize:14, color:'#1A1A1A' }}>{loc}</span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background: d.profit>=0?'#dcfce7':'#fee2e2', color: d.profit>=0?'#16a34a':'#dc2626', fontWeight:500 }}>{d.margin.toFixed(1)}%</span>
              </div>
              <div style={{ fontSize:22, fontWeight:700, color:'#1A1A1A', marginBottom:4 }}>{fmt(d.totalRev)}</div>
              <div style={{ fontSize:11, color:'#888', marginBottom:12 }}>Profit: <span style={{ color:d.profit>=0?'#16a34a':'#dc2626', fontWeight:600 }}>{fmt(d.profit)}</span></div>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                {[
                  { label:'Store', value:d.storeRev, color:'#F5C800' },
                  { label:'Uber', value:d.uberRev, color:'#06C167' },
                  { label:'DD', value:d.ddRev, color:'#FF3008' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex:1, textAlign:'center', padding:'6px 4px', borderRadius:8, background:'#f9f9f9' }}>
                    <div style={{ fontSize:10, color:'#888' }}>{label}</div>
                    <div style={{ fontSize:11, fontWeight:600, color }}>{fmtK(value)}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#aaa', marginBottom:4 }}>
                  <span>Revenue share</span><span>{share.toFixed(1)}%</span>
                </div>
                <div style={{ height:4, borderRadius:4, background:'#f0f0f0' }}>
                  <div style={{ height:4, borderRadius:4, width:`${share}%`, background:'#F5C800' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Table */}
      {card(
        <>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Location Comparison</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #f0f0f0' }}>
                  {['Location','Revenue','Cost','Profit','Margin','Transactions','Avg/Order'].map(h => (
                    <th key={h} style={{ textAlign: h==='Location'?'left':'right', padding:'8px 12px', fontWeight:500, color:'#888', fontSize:11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {locationNames.map(loc => {
                  const d = getLocData(loc)
                  return (
                    <tr key={loc} style={{ borderBottom:'1px solid #f9f9f9' }}>
                      <td style={{ padding:'10px 12px', fontWeight:600, color:'#1A1A1A' }}>{loc}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', color:'#1A1A1A' }}>{fmt(d.totalRev)}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', color:'#888' }}>{fmt(d.totalCost)}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:600, color:d.profit>=0?'#16a34a':'#dc2626' }}>{fmt(d.profit)}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', color:d.margin>=20?'#16a34a':d.margin>=10?'#d97706':'#dc2626' }}>{d.margin.toFixed(1)}%</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', color:'#555' }}>{d.tx.toLocaleString()}</td>
                      <td style={{ padding:'10px 12px', textAlign:'right', color:'#555' }}>{fmt(d.tx>0?d.totalRev/d.tx:0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Bar Chart */}
          <div style={{ marginTop:24 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Revenue vs Cost vs Profit</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={comparisonData} margin={{ top:0, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:12, fill:'#888' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize:12 }} />
                <Bar dataKey="revenue" name="Revenue" fill="#F5C800" radius={[4,4,0,0]} />
                <Bar dataKey="cost" name="Cost" fill="#ef4444" radius={[4,4,0,0]} />
                <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
