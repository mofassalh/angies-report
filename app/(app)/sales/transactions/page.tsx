'use client'
import { useFilters } from '@/components/FilterContext'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = { store:'#F5C800', uber:'#06C167', doordash:'#FF3008' }

export default function TransactionsPage() {
  const { filteredData, loading } = useFilters()

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-AU')}`
  const fmtK = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toLocaleString('en-AU')

  const storeTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_store)||0),0)
  const uberTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_uber)||0),0)
  const ddTx = filteredData.reduce((s,d)=>s+(parseInt(d.transactions_doordash)||0),0)
  const totalTx = storeTx + uberTx + ddTx
  const storeRev = filteredData.reduce((s,d)=>s+(parseFloat(d.revenue_store_net)||0),0)
  const uberRev = filteredData.reduce((s,d)=>s+(parseFloat(d.revenue_uber_gross)||0),0)
  const ddRev = filteredData.reduce((s,d)=>s+(parseFloat(d.revenue_doordash_gross)||0),0)

  const pieData = [
    { name:'Physical Store', value:storeTx, color:COLORS.store },
    { name:'Uber Eats', value:uberTx, color:COLORS.uber },
    { name:'DoorDash', value:ddTx, color:COLORS.doordash },
  ]

  const byWeek: Record<string,any> = {}
  filteredData.forEach(d => {
    const w = d.week_start
    if (!byWeek[w]) byWeek[w] = { week:w, store:0, uber:0, doordash:0 }
    byWeek[w].store += parseInt(d.transactions_store)||0
    byWeek[w].uber += parseInt(d.transactions_uber)||0
    byWeek[w].doordash += parseInt(d.transactions_doordash)||0
  })
  const weeklyData = Object.values(byWeek).sort((a,b)=>a.week.localeCompare(b.week)).map((d,i)=>({
    label:`W${i+1}`,
    store:d.store, uber:d.uber, doordash:d.doordash,
    total:d.store+d.uber+d.doordash,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background:'#fff', border:'0.5px solid #e0e0e0', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
        <div style={{ fontWeight:600, marginBottom:4 }}>{label}</div>
        {payload.map((p: any) => <div key={p.name} style={{ color:p.color||p.fill }}>{p.name}: {p.value.toLocaleString()}</div>)}
      </div>
    )
  }

  const card = (children: React.ReactNode) => (
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:20 }}>{children}</div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <h2 style={{ fontSize:18, fontWeight:600, color:'#1A1A1A' }}>Transaction Analysis</h2>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        {[
          { label:'Total Orders', value:totalTx.toLocaleString(), sub:`Avg ${fmt(totalTx>0?(storeRev+uberRev+ddRev)/totalTx:0)}/order`, color:'#1A1A1A' },
          { label:'Store Orders', value:storeTx.toLocaleString(), sub:`Avg ${fmt(storeTx>0?storeRev/storeTx:0)}/order`, color:COLORS.store },
          { label:'Uber Orders', value:uberTx.toLocaleString(), sub:`Avg ${fmt(uberTx>0?uberRev/uberTx:0)}/order`, color:COLORS.uber },
          { label:'DoorDash Orders', value:ddTx.toLocaleString(), sub:`Avg ${fmt(ddTx>0?ddRev/ddTx:0)}/order`, color:COLORS.doordash },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background:'#fff', borderRadius:12, border:'0.5px solid #e5e5e5', padding:16 }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:700, color }}>{loading?'—':value}</div>
            <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Pie + details */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {card(
          <>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Transaction Share</h3>
            <div style={{ display:'flex', alignItems:'center', gap:24 }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip formatter={(v:any)=>v.toLocaleString()}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                {pieData.map(({ name, value, color }) => {
                  const pct = totalTx>0?(value/totalTx*100).toFixed(1):'0'
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
                      <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{value.toLocaleString()} orders</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {card(
          <>
            <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Orders by Channel</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { name:'Physical Store', tx:storeTx, rev:storeRev, color:COLORS.store },
                { name:'Uber Eats', tx:uberTx, rev:uberRev, color:COLORS.uber },
                { name:'DoorDash', tx:ddTx, rev:ddRev, color:COLORS.doordash },
              ].map(({ name, tx, rev, color }) => (
                <div key={name} style={{ padding:12, borderRadius:10, background:'#f9f9f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:color }}/>
                    <span style={{ fontSize:13, fontWeight:500 }}>{name}</span>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:14, fontWeight:700, color }}>{tx.toLocaleString()}</div>
                    <div style={{ fontSize:11, color:'#aaa' }}>{fmt(tx>0?rev/tx:0)}/order</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Weekly Bar Chart */}
      {card(
        <>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#1A1A1A', marginBottom:16 }}>Weekly Transaction Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top:0, right:16, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={fmtK} tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false} width={45}/>
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
