'use client'
import { useFilters } from '@/components/FilterContext'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer, Legend } from 'recharts'

const COLORS = { store: '#F5C800', uber: '#06C167', doordash: '#FF3008' }

export default function RevenuePage() {
  const { filteredData, loading } = useFilters()

  const sum = (key: string) => filteredData.reduce((s, d) => s + (parseFloat(d[key]) || 0), 0)
  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-AU')}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const storeRev = sum('revenue_store_net')
  const uberRev = sum('revenue_uber_gross')
  const ddRev = sum('revenue_doordash_gross')
  const totalRev = storeRev + uberRev + ddRev
  const storeTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_store)||0),0)
  const uberTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_uber)||0),0)
  const ddTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_doordash)||0),0)

  // Pie chart data
  const pieData = [
    { name: 'Physical Store', value: Math.round(storeRev), color: COLORS.store },
    { name: 'Uber Eats', value: Math.round(uberRev), color: COLORS.uber },
    { name: 'DoorDash', value: Math.round(ddRev), color: COLORS.doordash },
  ]

  // Weekly data for line + bar charts
  const byWeek: Record<string, any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { week: w, store: 0, uber: 0, doordash: 0, total: 0 }
    byWeek[w].store += parseFloat(d.revenue_store_net) || 0
    byWeek[w].uber += parseFloat(d.revenue_uber_gross) || 0
    byWeek[w].doordash += parseFloat(d.revenue_doordash_gross) || 0
    byWeek[w].total += (parseFloat(d.revenue_store_net)||0) + (parseFloat(d.revenue_uber_gross)||0) + (parseFloat(d.revenue_doordash_gross)||0)
  })
  const weeklyData = Object.values(byWeek).sort((a,b)=>a.week.localeCompare(b.week)).map((d,i) => ({
    ...d,
    label: `W${i+1}`,
    store: Math.round(d.store),
    uber: Math.round(d.uber),
    doordash: Math.round(d.doordash),
    total: Math.round(d.total),
  }))

  const topWeeks = [...weeklyData].sort((a,b)=>b.total-a.total).slice(0,6)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:'#fff', border:'0.5px solid #e0e0e0', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
        <div style={{ fontWeight:600, marginBottom:4, color:'#1A1A1A' }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color:p.color }}>{p.name}: {fmtK(p.value)}</div>
        ))}
      </div>
    )
  }

  const card = (children: React.ReactNode) => (
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:20 }}>{children}</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <h2 style={{ fontSize:18, fontWeight:600, color:'#1A1A1A' }}>Revenue Analysis</h2>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        {[
          { label:'Total Revenue', value:fmt(totalRev), sub:'All channels', color:'#22c55e' },
          { label:'Physical Store', value:fmt(storeRev), sub:`${storeTx.toLocaleString()} orders`, color:'#F5C800' },
          { label:'Uber Eats', value:fmt(uberRev), sub:`${uberTx.toLocaleString()} orders`, color:'#06C167' },
          { label:'DoorDash', value:fmt(ddRev), sub:`${ddTx.toLocaleString()} orders`, color:'#FF3008' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:16 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#1A1A1A' }}>{loading ? '—' : value}</div>
            <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Pie + Top Weeks */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {card(
          <>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Revenue by Channel & Share</h3>
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmtK(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexDirection:'column', gap:12, flex:1 }}>
                {pieData.map(({ name, value, color }) => {
                  const pct = totalRev > 0 ? (value/totalRev*100).toFixed(1) : '0'
                  return (
                    <div key={name}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:10, height:10, borderRadius:'50%', background:color }} />
                          <span style={{ fontSize:12, color:'#555' }}>{name}</span>
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, color:'#1A1A1A' }}>{pct}%</span>
                      </div>
                      <div style={{ height:4, borderRadius:4, background:'#f0f0f0' }}>
                        <div style={{ height:4, borderRadius:4, width:`${pct}%`, background:color }} />
                      </div>
                      <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{fmtK(value)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {card(
          <>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Top Weeks by Revenue</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topWeeks} margin={{ top:0, right:0, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Revenue" fill="#F5C800" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Weekly Line Chart */}
      {card(
        <>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Weekly Revenue Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyData} margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12 }} />
              <Line type="monotone" dataKey="store" name="Store" stroke={COLORS.store} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="uber" name="Uber Eats" stroke={COLORS.uber} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="doordash" name="DoorDash" stroke={COLORS.doordash} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
