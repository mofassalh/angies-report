'use client'
import { useFilters } from '@/components/FilterContext'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = { store: '#F5C800', uber: '#06C167', doordash: '#FF3008' }

export default function ChannelPage() {
  const { filteredData, loading } = useFilters()

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-AU')}`
  const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : fmt(n)

  const storeRev = filteredData.reduce((s,d)=>s+(parseFloat(d.revenue_store_net)||0),0)
  const uberRev = filteredData.reduce((s,d)=>s+(parseFloat(d.revenue_uber_gross)||0),0)
  const ddRev = filteredData.reduce((s,d)=>s+(parseFloat(d.revenue_doordash_gross)||0),0)
  const totalRev = storeRev + uberRev + ddRev
  const storeTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_store)||0),0)
  const uberTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_uber)||0),0)
  const ddTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_doordash)||0),0)
  const totalTx = storeTx + uberTx + ddTx

  const pieData = [
    { name:'Physical Store', value:Math.round(storeRev), color:COLORS.store },
    { name:'Uber Eats', value:Math.round(uberRev), color:COLORS.uber },
    { name:'DoorDash', value:Math.round(ddRev), color:COLORS.doordash },
  ]

  const byWeek: Record<string,any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { week:w, store:0, uber:0, doordash:0 }
    byWeek[w].store += parseFloat(d.revenue_store_net)||0
    byWeek[w].uber += parseFloat(d.revenue_uber_gross)||0
    byWeek[w].doordash += parseFloat(d.revenue_doordash_gross)||0
  })
  const weeklyData = Object.values(byWeek).sort((a,b)=>a.week.localeCompare(b.week)).map((d,i)=>({
    label:`W${i+1}`,
    store:Math.round(d.store),
    uber:Math.round(d.uber),
    doordash:Math.round(d.doordash),
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:'#fff', border:'0.5px solid #e0e0e0', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
        <div style={{ fontWeight:600, marginBottom:4 }}>{label}</div>
        {payload.map((p: any) => <div key={p.name} style={{ color:p.color||p.fill }}>{p.name}: {fmtK(p.value)}</div>)}
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
          { label:'Total Revenue', value:fmt(totalRev), sub:`${totalTx.toLocaleString()} orders`, color:'#1A1A1A' },
          { label:'Physical Store', value:fmt(storeRev), sub:`${storeTx.toLocaleString()} orders · ${totalRev>0?(storeRev/totalRev*100).toFixed(1):0}%`, color:COLORS.store },
          { label:'Uber Eats', value:fmt(uberRev), sub:`${uberTx.toLocaleString()} orders · ${totalRev>0?(uberRev/totalRev*100).toFixed(1):0}%`, color:COLORS.uber },
          { label:'DoorDash', value:fmt(ddRev), sub:`${ddTx.toLocaleString()} orders · ${totalRev>0?(ddRev/totalRev*100).toFixed(1):0}%`, color:COLORS.doordash },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:16 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color }}>{loading?'—':value}</div>
            <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Pie + channel details */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {card(
          <>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Revenue Share by Channel</h3>
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>fmtK(v)}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                {pieData.map(({ name, value, color }) => {
                  const pct = totalRev>0?(value/totalRev*100).toFixed(1):'0'
                  return (
                    <div key={name}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:10, height:10, borderRadius:'50%', background:color }}/>
                          <span style={{ fontSize:12, color:'#555' }}>{name}</span>
                        </div>
                        <span style={{ fontSize:12, fontWeight:600 }}>{pct}%</span>
                      </div>
                      <div style={{ height:4, borderRadius:4, background:'#f0f0f0' }}>
                        <div style={{ height:4, borderRadius:4, width:`${pct}%`, background:color }}/>
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
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Channel Details</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { name:'Physical Store', rev:storeRev, tx:storeTx, color:COLORS.store },
                { name:'Uber Eats', rev:uberRev, tx:uberTx, color:COLORS.uber },
                { name:'DoorDash', rev:ddRev, tx:ddTx, color:COLORS.doordash },
              ].map(({ name, rev, tx, color }) => (
                <div key={name} style={{ padding:12, borderRadius:10, background:'#f9f9f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:color }}/>
                    <span style={{ fontSize:13, fontWeight:500, color:'#1A1A1A' }}>{name}</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:700, color }}>{fmtK(rev)}</div>
                    <div style={{ fontSize:11, color:'#aaa' }}>{tx.toLocaleString()} orders · {fmt(tx>0?rev/tx:0)}/order</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Weekly Channel Bar Chart */}
      {card(
        <>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Weekly Channel Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={55}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:12 }}/>
              <Bar dataKey="store" name="Store" stackId="a" fill={COLORS.store}/>
              <Bar dataKey="uber" name="Uber Eats" stackId="a" fill={COLORS.uber}/>
              <Bar dataKey="doordash" name="DoorDash" stackId="a" fill={COLORS.doordash} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
