'use client'
import { useFilters } from '@/components/FilterContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine } from 'recharts'

export default function PLPage() {
  const { filteredData, loading } = useFilters()

  const sum = (key: string) => filteredData.reduce((s, d) => s + (parseFloat(d[key]) || 0), 0)
  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-AU')}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : n <= -1000 ? `-$${(Math.abs(n)/1000).toFixed(1)}k` : fmt(n)

  const grossRev = sum('revenue_store_net') + sum('revenue_uber_gross') + sum('revenue_doordash_gross')
  const netRev = sum('revenue_store_net') + sum('revenue_uber_net') + sum('revenue_doordash_net')
  const totalCost = sum('cost_food') + sum('cost_staff') + sum('cost_operation')
  const grossProfit = grossRev - totalCost
  const netProfit = netRev - totalCost
  const profitPct = grossRev > 0 ? (netProfit/grossRev*100) : 0
  const totalTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_store)||0)+(parseInt(d.transactions_uber)||0)+(parseInt(d.transactions_doordash)||0),0)

  const byWeek: Record<string, any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { week:w, rev:0, cost:0 }
    byWeek[w].rev += (parseFloat(d.revenue_store_net)||0)+(parseFloat(d.revenue_uber_gross)||0)+(parseFloat(d.revenue_doordash_gross)||0)
    byWeek[w].cost += (parseFloat(d.cost_food)||0)+(parseFloat(d.cost_staff)||0)+(parseFloat(d.cost_operation)||0)
  })
  const weeklyData = Object.values(byWeek).sort((a,b)=>a.week.localeCompare(b.week)).map((d,i)=>({
    label: `W${i+1}`,
    profit: Math.round(d.rev - d.cost),
    revenue: Math.round(d.rev),
    cost: Math.round(d.cost),
    margin: d.rev > 0 ? parseFloat((((d.rev-d.cost)/d.rev)*100).toFixed(1)) : 0,
  }))

  const overallData = [
    { name:'Gross Revenue', value: Math.round(grossRev), color:'#22c55e' },
    { name:'Net Revenue', value: Math.round(netRev), color:'#4a9eff' },
    { name:'Total Cost', value: Math.round(totalCost), color:'#ef4444' },
    { name:'Gross Profit', value: Math.round(grossProfit), color:'#F5C800' },
    { name:'Net Profit', value: Math.round(netProfit), color: netProfit >= 0 ? '#16a34a' : '#dc2626' },
  ]

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

  const pc = (v: number) => v >= 20 ? '#16a34a' : v >= 10 ? '#d97706' : '#dc2626'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <h2 style={{ fontSize:18, fontWeight:600, color:'#1A1A1A' }}>P&L Summary</h2>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        {[
          { label:'Gross Revenue', value:fmt(grossRev), color:'#1A1A1A' },
          { label:'Net Profit', value:fmt(netProfit), color: netProfit>=0?'#16a34a':'#dc2626' },
          { label:'Profit Margin', value:`${profitPct.toFixed(1)}%`, color:pc(profitPct) },
          { label:'Avg/Order', value:fmt(totalTx>0?grossRev/totalTx:0), color:'#1A1A1A' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:16 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color }}>{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      {/* Weekly P&L Bar Chart */}
      {card(
        <>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Weekly P&L</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#e0e0e0" />
              <Bar dataKey="profit" name="Net Profit" radius={[4,4,0,0]}>
                {weeklyData.map((entry, i) => <Cell key={i} fill={entry.profit >= 0 ? '#16a34a' : '#dc2626'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Overall P&L + Margin Line side by side */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {card(
          <>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Overall P&L</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={overallData} margin={{ top:0, right:0, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:10, fill:'#888' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(v: any) => fmtK(v)} />
                <Bar dataKey="value" name="Amount" radius={[4,4,0,0]}>
                  {overallData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {card(
          <>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Weekly Profit Margin %</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyData} margin={{ top:0, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v=>`${v}%`} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <ReferenceLine y={20} stroke="#16a34a" strokeDasharray="4 4" label={{ value:'20%', fontSize:10, fill:'#16a34a' }} />
                <ReferenceLine y={10} stroke="#d97706" strokeDasharray="4 4" label={{ value:'10%', fontSize:10, fill:'#d97706' }} />
                <Line type="monotone" dataKey="margin" name="Margin" stroke="#4a9eff" strokeWidth={2} dot={{ r:3, fill:'#4a9eff' }} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  )
}
