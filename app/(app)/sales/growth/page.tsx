'use client'
import { useFilters } from '@/components/FilterContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'

export default function GrowthPage() {
  const { filteredData, loading } = useFilters()

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-AU')}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const byWeek: Record<string,any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { week:w, rev:0, cost:0, tx:0 }
    byWeek[w].rev += (parseFloat(d.revenue_store_net)||0)+(parseFloat(d.revenue_uber_gross)||0)+(parseFloat(d.revenue_doordash_gross)||0)
    byWeek[w].cost += (parseFloat(d.cost_food)||0)+(parseFloat(d.cost_staff)||0)+(parseFloat(d.cost_operation)||0)
    byWeek[w].tx += (parseInt(d.transactions_store)||0)+(parseInt(d.transactions_uber)||0)+(parseInt(d.transactions_doordash)||0)
  })

  const weeks = Object.values(byWeek).sort((a,b)=>a.week.localeCompare(b.week))
  const weeklyData = weeks.map((d,i) => {
    const prev = weeks[i-1]
    const revGrowth = prev && prev.rev>0 ? parseFloat(((d.rev-prev.rev)/prev.rev*100).toFixed(1)) : null
    const txGrowth = prev && prev.tx>0 ? parseFloat(((d.tx-prev.tx)/prev.tx*100).toFixed(1)) : null
    const profit = d.rev - d.cost
    const margin = d.rev>0 ? parseFloat((profit/d.rev*100).toFixed(1)) : 0
    return { label:`W${i+1}`, rev:Math.round(d.rev), profit:Math.round(profit), margin, revGrowth, txGrowth }
  })

  const growthData = weeklyData.filter(d => d.revGrowth !== null)
  const avgGrowth = growthData.reduce((s,d)=>s+(d.revGrowth||0),0)/Math.max(growthData.length,1)

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:'#fff', border:'0.5px solid #e0e0e0', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
        <div style={{ fontWeight:600, marginBottom:4 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color:p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name.includes('%') ? `${p.value}%` : p.name.includes('Revenue') || p.name.includes('Profit') ? fmtK(p.value) : `${p.value}%`}
          </div>
        ))}
      </div>
    )
  }

  const card = (children: React.ReactNode) => (
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:20 }}>{children}</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        {[
          { label:'Avg Weekly Growth', value:`${avgGrowth>=0?'+':''}${avgGrowth.toFixed(1)}%`, color:avgGrowth>=0?'#16a34a':'#dc2626' },
          { label:'Best Growth', value:growthData.length>0?`+${Math.max(...growthData.map(d=>d.revGrowth||0)).toFixed(1)}%`:'—', color:'#16a34a' },
          { label:'Worst Growth', value:growthData.length>0?`${Math.min(...growthData.map(d=>d.revGrowth||0)).toFixed(1)}%`:'—', color:'#dc2626' },
          { label:'Weeks Tracked', value:weeklyData.length.toString(), color:'#1A1A1A' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:16 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color }}>{loading?'—':value}</div>
          </div>
        ))}
      </div>

      {/* Week over Week Growth Line Chart */}
      {card(
        <>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Week over Week Revenue Growth %</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyData} margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`${v}%`} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={45}/>
              <Tooltip formatter={(v:any,name:any)=>[`${v}%`, name]}/>
              <ReferenceLine y={0} stroke="#e0e0e0" strokeWidth={1}/>
              <Line type="monotone" dataKey="revGrowth" name="Revenue Growth %" stroke="#4a9eff" strokeWidth={2} dot={{ r:3, fill:'#4a9eff' }} connectNulls={false}/>
              <Line type="monotone" dataKey="txGrowth" name="Order Growth %" stroke="#F5C800" strokeWidth={2} dot={{ r:3, fill:'#F5C800' }} connectNulls={false}/>
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Revenue + Profit Line Chart */}
      {card(
        <>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Revenue & Profit Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyData} margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={55}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:12 }}/>
              <ReferenceLine y={0} stroke="#e0e0e0"/>
              <Line type="monotone" dataKey="rev" name="Revenue" stroke="#F5C800" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#16a34a" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Margin Line Chart */}
      {card(
        <>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Weekly Profit Margin %</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyData} margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`${v}%`} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={45}/>
              <Tooltip formatter={(v:any)=>[`${v}%`,'Margin']}/>
              <ReferenceLine y={20} stroke="#16a34a" strokeDasharray="4 4" label={{ value:'20%', fontSize:10, fill:'#16a34a', position:'right' }}/>
              <ReferenceLine y={10} stroke="#d97706" strokeDasharray="4 4" label={{ value:'10%', fontSize:10, fill:'#d97706', position:'right' }}/>
              <ReferenceLine y={0} stroke="#e0e0e0"/>
              <Line type="monotone" dataKey="margin" name="Margin %" stroke="#8b5cf6" strokeWidth={2} dot={{ r:3, fill:'#8b5cf6' }}/>
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
