'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ChevronDown } from 'lucide-react'

const MONTH_NAMES: Record<string, string> = { '01':'January','02':'February','03':'March','04':'April','05':'May','06':'June','07':'July','08':'August','09':'September','10':'October','11':'November','12':'December' }

function Dropdown({ label, options, selected, multi, onChange }: {
  label: string, options: {key:string,label:string}[], selected: string[], multi?: boolean, onChange: (v:string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top:0, left:0 })
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!btnRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const handleOpen = () => {
    if (btnRef.current) { const r = btnRef.current.getBoundingClientRect(); setMenuPos({ top: r.bottom + 4, left: r.left }) }
    setOpen(o => !o)
  }
  const toggle = (key: string) => { if (!multi) { onChange([key]); setOpen(false); return } onChange(selected.includes(key) ? selected.filter(s => s !== key) : [...selected, key]) }
  const hasVal = selected.length > 0
  const dispLabel = !hasVal ? label : selected.length === 1 ? (options.find(o => o.key === selected[0])?.label || selected[0]) : `${selected.length} selected`
  return (
    <>
      <button ref={btnRef} onClick={handleOpen} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 14px', border:`0.5px solid ${hasVal?'#E8C84A':'#e0e0e0'}`, borderRadius:8, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', background:hasVal?'#FFFBE6':'white', color:hasVal?'#8A6800':'#555', fontWeight:hasVal?500:400 }}>
        {dispLabel}
        {hasVal && multi && <span onClick={e=>{e.stopPropagation();onChange([])}} style={{marginLeft:2,fontSize:11}}>✕</span>}
        <ChevronDown size={12}/>
      </button>
      {open && (
        <div ref={menuRef} style={{ position:'fixed', top:menuPos.top, left:menuPos.left, zIndex:99999, minWidth:220, background:'#fff', border:'0.5px solid #e0e0e0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', maxHeight:280, overflowY:'auto' }}>
          {multi && <div onClick={()=>onChange([])} style={{ padding:'9px 14px', fontSize:12, cursor:'pointer', background:selected.length===0?'#FFFBE6':'transparent', color:selected.length===0?'#8A6800':'#333', fontWeight:selected.length===0?500:400 }}>All {label}</div>}
          {options.map(opt => { const isSel = selected.includes(opt.key); return (
            <div key={opt.key} onClick={()=>toggle(opt.key)} style={{ padding:'9px 14px', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:8, background:isSel?'#FFFBE6':'transparent', color:isSel?'#8A6800':'#333' }}>
              {multi && <div style={{ width:14, height:14, border:`1.5px solid ${isSel?'#E8C84A':'#ccc'}`, borderRadius:3, background:isSel?'#E8C84A':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{isSel && <span style={{fontSize:9,color:'#5a3e00',fontWeight:700}}>✓</span>}</div>}
              {opt.label}
            </div>
          )})}
        </div>
      )}
    </>
  )
}

export default function WeeklyDetailsReport() {
  const [allData, setAllData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('weekly')
  const [selLocations, setSelLocations] = useState<string[]>([])
  const [selRestaurants, setSelRestaurants] = useState<string[]>([])
  const [fromWeek, setFromWeek] = useState('')
  const [toWeek, setToWeek] = useState('')
  const [selMonths, setSelMonths] = useState<string[]>([])
  const [selYears, setSelYears] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('report_weekly_data').select('restaurant_id,restaurant_name,location,week_start,partner,orders,gross_revenue,net_revenue,food_cost,staff_cost,operation_cost').order('week_start')
      const d = data || []
      setAllData(d)
      const weeks = [...new Set(d.map((x: any) => x.week_start))].sort() as string[]
      if (weeks.length > 0) { setFromWeek(weeks[0]); setToWeek(weeks[weeks.length-1]) }
      setLoading(false)
    }
    fetch()
  }, [])

  const locationNames = [...new Set(allData.map((r: any) => r.location).filter(Boolean))] as string[]
  const restaurantNames = [...new Set(allData.filter(r => selLocations.length===0||selLocations.includes(r.location)).map(r => r.restaurant_name).filter(Boolean))] as string[]
  const allWeeks = [...new Set(allData.map(d => d.week_start))].sort() as string[]
  const allMonths = [...new Set(allData.map(d => d.week_start.substring(0,7)))].sort() as string[]
  const allYears = [...new Set(allData.map(d => d.week_start.substring(0,4)))].sort() as string[]
  const weekOpts = allWeeks.map((w,i) => ({ key:w, label:`Week ${i+1} — ${new Date(w+'T00:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'})}` }))
  const monthOpts = allMonths.map(m => { const [y,mo]=m.split('-'); return { key:m, label:`${MONTH_NAMES[mo]} ${y}` } })
  const yearOpts = allYears.map(y => ({ key:y, label:y }))
  const baseFiltered = allData.filter(d => (selLocations.length===0||selLocations.includes(d.location)) && (selRestaurants.length===0||selRestaurants.includes(d.restaurant_name)))

  const agg = (rows: any[]) => {
    const storeRows=rows.filter(r=>r.partner==='Store'), uberRows=rows.filter(r=>r.partner==='Uber Eats'), ddRows=rows.filter(r=>r.partner==='DoorDash')
    const storeTx=storeRows.reduce((s,d)=>s+(parseInt(d.orders)||0),0), uberTx=uberRows.reduce((s,d)=>s+(parseInt(d.orders)||0),0), ddTx=ddRows.reduce((s,d)=>s+(parseInt(d.orders)||0),0)
    const totalTx=rows.reduce((s,d)=>s+(parseInt(d.orders)||0),0)
    const storeRev=storeRows.reduce((s,d)=>s+(parseFloat(d.net_revenue)||0),0)
    const uberGross=uberRows.reduce((s,d)=>s+(parseFloat(d.gross_revenue)||0),0), ddGross=ddRows.reduce((s,d)=>s+(parseFloat(d.gross_revenue)||0),0)
    const uberNet=uberRows.reduce((s,d)=>s+(parseFloat(d.net_revenue)||0),0), ddNet=ddRows.reduce((s,d)=>s+(parseFloat(d.net_revenue)||0),0)
    const grossRev=storeRev+uberGross+ddGross, netRev=storeRev+uberNet+ddNet
    const seen=new Set<string>(); let costFood=0,costStaff=0,costOp=0
    for(const r of rows){const key=`${r.restaurant_id}__${r.week_start}`;if(!seen.has(key)){seen.add(key);costFood+=parseFloat(r.food_cost)||0;costStaff+=parseFloat(r.staff_cost)||0;costOp+=parseFloat(r.operation_cost)||0}}
    const totalCost=costFood+costStaff+costOp, grossProfit=grossRev-totalCost, netProfit=netRev-totalCost
    return { storeTx,uberTx,ddTx,totalTx,storeRev,uberGross,ddGross,uberNet,ddNet,grossRev,netRev,costFood,costStaff,costOp,totalCost,grossProfit,netProfit,
      profitPct:grossRev>0?netProfit/grossRev*100:0, perTx:totalTx>0?grossRev/totalTx:0,
      staffPct:grossRev>0?costStaff/grossRev*100:0, foodPct:grossRev>0?costFood/grossRev*100:0, opPct:grossRev>0?costOp/grossRev*100:0,
      foodPerTx:totalTx>0?costFood/totalTx:0, staffPerTx:totalTx>0?costStaff/totalTx:0, opPerTx:totalTx>0?costOp/totalTx:0,
      totalCostPerTx:totalTx>0?totalCost/totalTx:0, grossProfitPerTx:totalTx>0?grossProfit/totalTx:0, netProfitPerTx:totalTx>0?netProfit/totalTx:0,
      uberComm:uberGross>0?(uberGross-uberNet)/uberGross*100:0, ddComm:ddGross>0?(ddGross-ddNet)/ddGross*100:0 }
  }

  const f$=(n:number)=>n===0?'—':`$${Math.round(n).toLocaleString('en-AU')}`
  const f$d=(n:number)=>n===0?'—':`$${n.toFixed(2)}`
  const fp=(n:number)=>n===0?'—':`${n.toFixed(1)}%`
  const fn=(n:number)=>n===0?'—':n.toLocaleString('en-AU')
  const profitColor=(v:number)=>v>=20?'#16a34a':v>=10?'#d97706':'#dc2626'
  const signColor=(v:number)=>v>=0?'#16a34a':'#dc2626'

  type Col = { key:string, label:string, sub:string, sub2?:string, isTotal:boolean, rows:any[] }
  const columns: Col[] = []
  if (viewMode==='weekly') {
    const sel=allWeeks.filter(w=>w>=fromWeek&&w<=toWeek), mMap:Record<string,string[]>={}
    sel.forEach(w=>{const m=w.substring(0,7);if(!mMap[m])mMap[m]=[];mMap[m].push(w)})
    Object.entries(mMap).sort().forEach(([m,weeks])=>{
      const [y,mo]=m.split('-')
      weeks.forEach(w=>{const idx=allWeeks.indexOf(w)+1;columns.push({key:w,label:`Week ${idx}`,sub:new Date(w+'T00:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'}),isTotal:false,rows:baseFiltered.filter(d=>d.week_start===w)})})
      columns.push({key:`t-${m}`,label:MONTH_NAMES[mo]||mo,sub:'Monthly total',sub2:y,isTotal:true,rows:baseFiltered.filter(d=>weeks.includes(d.week_start))})
    })
  } else if (viewMode==='monthly') {
    const months=selMonths.length>0?allMonths.filter(m=>selMonths.includes(m)):allMonths, yMap:Record<string,string[]>={}
    months.forEach(m=>{const y=m.substring(0,4);if(!yMap[y])yMap[y]=[];yMap[y].push(m)})
    Object.entries(yMap).sort().forEach(([y,mos])=>{
      mos.forEach(m=>{const [,mo]=m.split('-');columns.push({key:m,label:MONTH_NAMES[mo]||mo,sub:y,isTotal:false,rows:baseFiltered.filter(d=>d.week_start.startsWith(m))})})
      columns.push({key:`t-${y}`,label:y,sub:'Annual total',isTotal:true,rows:baseFiltered.filter(d=>mos.some(m=>d.week_start.startsWith(m)))})
    })
  } else {
    const years=selYears.length>0?allYears.filter(y=>selYears.includes(y)):allYears
    years.forEach(y=>{
      const mos=allMonths.filter(m=>m.startsWith(y))
      mos.forEach(m=>{const [,mo]=m.split('-');columns.push({key:m,label:MONTH_NAMES[mo]||mo,sub:y,isTotal:false,rows:baseFiltered.filter(d=>d.week_start.startsWith(m))})})
      columns.push({key:`t-${y}`,label:y,sub:'Annual total',isTotal:true,rows:baseFiltered.filter(d=>d.week_start.startsWith(y))})
    })
  }

  type DataRow = {section:string}|{label:string,get:(d:ReturnType<typeof agg>)=>string,indent?:boolean,bold?:boolean,muted?:boolean,color?:(d:ReturnType<typeof agg>)=>string}
  const rows: DataRow[] = [
    {section:'Summary'},
    {label:'Total # Transactions',get:d=>fn(d.totalTx),bold:true},
    {label:'Per Transaction Revenue',get:d=>f$d(d.perTx)},
    {label:'Staff Cost %',get:d=>fp(d.staffPct),indent:true},
    {label:'Food Cost %',get:d=>fp(d.foodPct),indent:true},
    {label:'Operation Cost %',get:d=>fp(d.opPct),indent:true},
    {section:'Revenue'},
    {label:'Store Revenue',get:d=>f$(d.storeRev),indent:true},
    {label:'Total Gross Revenue',get:d=>f$(d.grossRev),bold:true},
    {label:'Total Net Revenue',get:d=>f$(d.netRev),bold:true},
    {section:'Costs'},
    {label:'Food Cost',get:d=>f$(d.costFood),indent:true},
    {label:'Per Transaction',get:d=>f$d(d.foodPerTx),indent:true,muted:true},
    {label:'Staff Cost',get:d=>f$(d.costStaff),indent:true},
    {label:'Per Transaction',get:d=>f$d(d.staffPerTx),indent:true,muted:true},
    {label:'Operation Cost',get:d=>f$(d.costOp),indent:true},
    {label:'Per Transaction',get:d=>f$d(d.opPerTx),indent:true,muted:true},
    {label:'Total Cost',get:d=>f$(d.totalCost),bold:true},
    {label:'Per Transaction',get:d=>f$d(d.totalCostPerTx),bold:true,muted:true},
    {section:'Profit'},
    {label:'Gross Profit',get:d=>f$(d.grossProfit),bold:true,color:d=>signColor(d.grossProfit)},
    {label:'Per Transaction',get:d=>f$d(d.grossProfitPerTx),muted:true,color:d=>signColor(d.grossProfitPerTx)},
    {label:'Net Profit',get:d=>f$(d.netProfit),bold:true,color:d=>signColor(d.netProfit)},
    {label:'Per Transaction',get:d=>f$d(d.netProfitPerTx),muted:true,color:d=>signColor(d.netProfitPerTx)},
    {label:'Profit %',get:d=>fp(d.profitPct),bold:true,color:d=>profitColor(d.profitPct)},
    {section:'Transactions'},
    {label:'Store',get:d=>fn(d.storeTx),indent:true},
    {label:'Uber Eats',get:d=>fn(d.uberTx),indent:true},
    {label:'DoorDash',get:d=>fn(d.ddTx),indent:true},
    {label:'Total',get:d=>fn(d.totalTx),bold:true},
    {section:'Delivery Partners'},
    {label:'Uber Eats Gross',get:d=>f$(d.uberGross),indent:true},
    {label:'Uber Eats Net',get:d=>f$(d.uberNet),indent:true},
    {label:'Commission %',get:d=>fp(d.uberComm),indent:true,muted:true,color:_d=>'#dc2626'},
    {label:'DoorDash Gross',get:d=>f$(d.ddGross),indent:true},
    {label:'DoorDash Net',get:d=>f$(d.ddNet),indent:true},
    {label:'Commission %',get:d=>fp(d.ddComm),indent:true,muted:true,color:_d=>'#dc2626'},
  ]

  // KPI aggregation
  const allFiltered = baseFiltered.filter(d => {
    if (viewMode==='weekly') return d.week_start>=fromWeek && d.week_start<=toWeek
    if (viewMode==='monthly') return selMonths.length===0||selMonths.some(m=>d.week_start.startsWith(m))
    return selYears.length===0||selYears.some(y=>d.week_start.startsWith(y))
  })
  const kpiData = agg(allFiltered)

  const LBL_W = 205

  const thBase: React.CSSProperties = {
    position:'sticky', top:0, zIndex:10, textAlign:'right', padding:'8px 10px',
    fontSize:11, fontWeight:400, whiteSpace:'nowrap',
    borderBottom:'1px solid #e8e8e8', background:'white', color:'#888',
  }
  const thTotal: React.CSSProperties = {
    position:'sticky', top:0, zIndex:10, textAlign:'right', padding:'8px 10px',
    fontSize:11, fontWeight:500, whiteSpace:'nowrap',
    borderBottom:'2px solid #E8C84A',
    background:'#f8f8f6',
    color:'#444',
    borderLeft:'1px solid rgba(232,200,74,0.35)',
    borderRight:'1px solid rgba(232,200,74,0.35)',
  }

  if (loading) return (
    <div style={{minHeight:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,borderRadius:'50%',border:'2px solid #E8C84A',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14,fontFamily:'var(--font-sans,system-ui)'}}>

      {/* KPI Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
        {[
          {label:'Total Revenue',value:f$(kpiData.grossRev),sub:`Net ${f$(kpiData.netRev)}`,color:'#B8960A'},
          {label:'Net Profit',value:f$(kpiData.netProfit),sub:`${kpiData.profitPct.toFixed(1)}% margin`,color:kpiData.netProfit>=0?'#16a34a':'#dc2626'},
          {label:'Transactions',value:fn(kpiData.totalTx),sub:'all channels',color:'#1a1a1a'},
          {label:'Avg per Tx',value:f$d(kpiData.perTx),sub:'gross revenue',color:'#1a1a1a'},
        ].map((k,i)=>(
          <div key={i} style={{background:'white',borderRadius:10,padding:'12px 14px',border:'0.5px solid #ebebeb'}}>
            <div style={{fontSize:10,color:'#aaa',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.8px'}}>{k.label}</div>
            <div style={{fontSize:18,fontWeight:500,color:k.color}}>{k.value}</div>
            <div style={{fontSize:11,color:'#aaa',marginTop:3}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{background:'white',borderRadius:12,border:'0.5px solid #ebebeb',overflow:'hidden'}}>

        {/* Filter Bar */}
        <div style={{padding:'10px 14px',display:'flex',alignItems:'center',gap:8,borderBottom:'0.5px solid #ebebeb',flexWrap:'wrap'}}>
          <Dropdown label="Weekly" options={[{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'},{key:'yearly',label:'Yearly'}]} selected={[viewMode]} onChange={v=>{setViewMode(v[0]);setSelMonths([]);setSelYears([])}} />
          <div style={{width:1,height:20,background:'#e8e8e8'}}/>
          <Dropdown label="Locations" options={locationNames.map(l=>({key:l,label:l}))} selected={selLocations} multi onChange={v=>{setSelLocations(v);setSelRestaurants([])}} />
          <Dropdown label="Restaurants" options={restaurantNames.map(r=>({key:r,label:r}))} selected={selRestaurants} multi onChange={setSelRestaurants} />
          <div style={{width:1,height:20,background:'#e8e8e8'}}/>
          {viewMode==='weekly' && (
            <>
              <span style={{fontSize:11,color:'#aaa'}}>From</span>
              <Dropdown label="From" options={weekOpts} selected={[fromWeek]} onChange={v=>setFromWeek(v[0])} />
              <span style={{fontSize:11,color:'#aaa'}}>To</span>
              <Dropdown label="To" options={weekOpts} selected={[toWeek]} onChange={v=>setToWeek(v[0])} />
            </>
          )}
          {viewMode==='monthly' && <Dropdown label="Months" options={monthOpts} selected={selMonths} multi onChange={setSelMonths} />}
          {viewMode==='yearly' && <Dropdown label="Years" options={yearOpts} selected={selYears} multi onChange={setSelYears} />}
          {(selLocations.length>0||selRestaurants.length>0) && (
            <button onClick={()=>{setSelLocations([]);setSelRestaurants([])}} style={{padding:'5px 12px',border:'0.5px solid #fccaca',borderRadius:8,background:'#fff5f5',color:'#cc0000',fontSize:12,cursor:'pointer'}}>Clear ✕</button>
          )}
        </div>

        {/* Table */}
        <div style={{overflow:'auto'}}>
          <table style={{borderCollapse:'collapse',fontSize:12,tableLayout:'fixed',width:`${LBL_W+columns.reduce((s,c)=>s+(c.isTotal?110:95),0)}px`}}>
            <colgroup>
              <col style={{width:LBL_W}}/>
              {columns.map((_,i)=><col key={i} style={{width:columns[i].isTotal?110:95}}/>)}
            </colgroup>
            <thead>
              <tr>
                <th style={{position:'sticky',top:0,left:0,zIndex:20,width:LBL_W,background:'white',borderBottom:'1px solid #e8e8e8',textAlign:'left',padding:'8px 12px',fontSize:11,fontWeight:400,color:'#aaa'}}></th>
                {columns.map((col,i)=>(
                  col.isTotal ? (
                    <th key={i} style={thTotal}>
                      <div style={{fontSize:9,fontWeight:400,color:'#aaa',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.6px'}}>{col.sub}</div>
                      <div style={{fontSize:12,fontWeight:500,color:'#333'}}>{col.label}</div>
                      {col.sub2 && <div style={{fontSize:10,fontWeight:400,color:'#aaa'}}>{col.sub2}</div>}
                    </th>
                  ) : (
                    <th key={i} style={thBase}>
                      <div>{col.label}</div>
                      <div style={{fontWeight:400,fontSize:10,color:'#ccc'}}>{col.sub}</div>
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row,ri)=>{
                if('section' in row) return (
                  <tr key={ri}>
                    <td style={{position:'sticky',left:0,zIndex:6,width:LBL_W,background:'#f8f8f6',fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',color:'#8A6800',borderTop:'4px solid #f0f0ee',padding:'6px 12px 5px',whiteSpace:'nowrap',borderRight:'0.5px solid #e8e8e8',borderLeft:'3px solid #E8C84A'}}>{row.section}</td>
                    {columns.map((_,ci)=><td key={ci} style={{background:'#f8f8f6',borderTop:'4px solid #f0f0ee',borderBottom:'0.5px solid #ebebeb', ...(columns[ci].isTotal?{borderLeft:'1px solid rgba(232,200,74,0.35)',borderRight:'1px solid rgba(232,200,74,0.35)'}:{})}}/>)}
                  </tr>
                )
                const isBold='bold' in row&&row.bold
                const isMuted='muted' in row&&row.muted
                const isIndent='indent' in row&&row.indent
                return (
                  <tr key={ri} style={{}} onMouseEnter={e=>(e.currentTarget.style.background='#fafaf8')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                    <td style={{position:'sticky',left:0,zIndex:5,width:LBL_W,background:isBold?'#fafaf8':'white',borderRight:'0.5px solid #e8e8e8',textAlign:'left',padding:'6px 12px',paddingLeft:isIndent?22:12,fontWeight:isBold?500:400,color:isMuted?'#bbb':isIndent?'#888':'#1a1a1a',fontSize:isMuted?11:12,borderBottom:'0.5px solid #ebebeb',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{row.label}</td>
                    {columns.map((col,ci)=>{
                      const d=agg(col.rows)
                      const val=row.get(d)
                      const customColor='color' in row&&row.color?row.color(d):null
                      const defaultColor=col.isTotal?'#333':'#1a1a1a'
                      const color=customColor||defaultColor
                      return (
                        <td key={ci} style={{
                          textAlign:'right',padding:'6px 10px',whiteSpace:'nowrap',
                          borderBottom:'0.5px solid #ebebeb',
                          background:isBold?(col.isTotal?'#f4f3ef':'#fafaf8'):(col.isTotal?'#f8f8f6':'transparent'),
                          color, fontWeight:isBold?500:400,
                          fontSize:isMuted?11:12,
                          ...(col.isTotal?{borderLeft:'1px solid rgba(232,200,74,0.35)',borderRight:'1px solid rgba(232,200,74,0.35)'}:{})
                        }}>{val}</td>
                      )
                    })}
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
