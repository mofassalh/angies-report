'use client'
import { useFilters } from '@/components/FilterContext'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CostPage() {
  const { filteredData, loading } = useFilters()

  const sum = (key: string) => filteredData.reduce((s, d) => s + (parseFloat(d[key]) || 0), 0)
  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-AU')}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const costFood = sum('cost_food')
  const costStaff = sum('cost_staff')
  const costOp = sum('cost_operation')
  const totalCost = costFood + costStaff + costOp
  const totalRev = sum('revenue_store_net') + sum('revenue_uber_gross') + sum('revenue_doordash_gross')

  const pieData = [
    { name: 'Food', value: Math.round(costFood), color: '#f97316' },
    { name: 'Staff', value: Math.round(costStaff), color: '#8b5cf6' },
    { name: 'Operations', value: Math.round(costOp), color: '#4a9eff' },
  ]

  const byWeek: Record<string, any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { week:w, food:0, staff:0, op:0, rev:0 }
    byWeek[w].food += parseFloat(d.cost_food)||0
    byWeek[w].staff += parseFloat(d.cost_staff)||0
    byWeek[w].op += parseFloat(d.cost_operation)||0
    byWeek[w].rev += (parseFloat(d.revenue_store_net)||0)+(parseFloat(d.revenue_uber_gross)||0)+(parseFloat(d.revenue_doordash_gross)||0)
  })
  const weeklyData = Object.values(byWeek).sort((a,b)=>a.week.localeCompare(b.week)).map((d,i)=>({
    label:`W${i+1}`,
    food: Math.round(d.food),
    staff: Math.round(d.staff),
    op: Math.round(d.op),
    total: Math.round(d.food+d.staff+d.op),
    rev: Math.round(d.rev),
  }))

  const ratioData = [
    { name:'Revenue', value: Math.round(totalRev), color:'#22c55e' },
    { name:'Total Cost', value: Math.round(totalCost), color:'#ef4444' },
    { name:'Gross Profit', value: Math.round(totalRev-totalCost), color:'#F5C800' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:'#fff', border:'0.5px solid #e0e0e0', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
        <div style={{ fontWeight:600, marginBottom:4, color:'#1A1A1A' }}>{label}</div>
        {payload.map((p: any) => <div key={p.name} style={{ color:p.color }}>{p.name}: {fmtK(p.value)}</div>)}
      </div>
    )
  }

  const card = (children: React.ReactNode) => (
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:20 }}>{children}</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <h2 style={{ fontSize:18, fontWeight:600, color:'#1A1A1A' }}>Cost Analysis</h2>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        {[
          { label:'Total Cost', value:fmt(totalCost), color:'#ef4444' },
          { label:'Food Cost', value:fmt(costFood), color:'#f97316' },
          { label:'Staff Cost', value:fmt(costStaff), color:'#8b5cf6' },
          { label:'Operations', value:fmt(costOp), color:'#4a9eff' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:16 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color }}>{loading ? '—' : value}</div>
            <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>{totalRev>0?(value.replace('$','').replace(/,/g,'') as any/totalRev*100).toFixed(1)+'% of revenue':''}</div>
          </div>
        ))}
      </div>

      {/* Pie + Bar side by side */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {card(
          <>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Cost Breakdown</h3>
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
                  const pct = totalCost > 0 ? (value/totalCost*100).toFixed(1) : '0'
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
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Cost vs Revenue Ratio</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ratioData} margin={{ top:0, right:0, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={55} />
                <Tooltip formatter={(v: any) => fmtK(v)} />
                <Bar dataKey="value" name="Amount" radius={[4,4,0,0]}>
                  {ratioData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Weekly Cost Trend Bar Chart */}
      {card(
        <>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Weekly Cost Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="food" name="Food" stackId="a" fill="#f97316" />
              <Bar dataKey="staff" name="Staff" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="op" name="Operations" stackId="a" fill="#4a9eff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
