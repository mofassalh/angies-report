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
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }

  const toggle = (key: string) => {
    if (!multi) { onChange([key]); setOpen(false); return }
    onChange(selected.includes(key) ? selected.filter(s => s !== key) : [...selected, key])
  }

  const hasVal = selected.length > 0
  const dispLabel = !hasVal ? label : selected.length === 1 ? (options.find(o => o.key === selected[0])?.label || selected[0]) : `${selected.length} selected`

  return (
    <>
      <button ref={btnRef} onClick={handleOpen} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', border:`0.5px solid ${hasVal?'#D4A900':'var(--color-border-secondary)'}`, borderRadius:20, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', background:hasVal?'#FFF3B0':'var(--color-background-primary)', color:hasVal?'#7A5F00':'var(--color-text-secondary)', fontWeight:hasVal?500:400 }}>
        {dispLabel}
        {hasVal && multi && <span onClick={e=>{e.stopPropagation();onChange([])}} style={{marginLeft:2,fontSize:11}}>✕</span>}
        <ChevronDown size={12}/>
      </button>
      {open && (
        <div ref={menuRef} style={{ position:'fixed', top:pos.top, left:pos.left, zIndex:999999, minWidth:220, background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-secondary)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', maxHeight:280, overflowY:'auto' }}>
          {multi && <div onClick={()=>onChange([])} style={{ padding:'9px 14px', fontSize:12, cursor:'pointer', background:selected.length===0?'#FFF3B0':'transparent', color:selected.length===0?'#7A5F00':'var(--color-text-primary)', fontWeight:selected.length===0?500:400 }}>All {label}</div>}
          {options.map(opt => {
            const isSel = selected.includes(opt.key)
            return (
              <div key={opt.key} onClick={()=>toggle(opt.key)} style={{ padding:'9px 14px', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:8, background:isSel?'#FFF3B0':'transparent', color:isSel?'#7A5F00':'var(--color-text-primary)' }}>
                {multi && <div style={{ width:14, height:14, border:`1.5px solid ${isSel?'#D4A900':'var(--color-border-secondary)'}`, borderRadius:3, background:isSel?'#D4A900':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{isSel && <span style={{fontSize:9,color:'#1A1A1A',fontWeight:700}}>✓</span>}</div>}
                {opt.label}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function ReportingPage() {
  const [allData, setAllData] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('weekly')
  const [selLocations, setSelLocations] = useState<string[]>([])
  const [selRestaurants, setSelRestaurants] = useState<string[]>([])
  const [fromWeek, setFromWeek] = useState('')
  const [toWeek, setToWeek] = useState('')
  const [selMonths, setSelMonths] = useState<string[]>([])
  const [selYears, setSelYears] = useState<string[]>([])
  const supabase = createClient()

  // Refs for JS-based sticky
  const containerRef = useRef<HTMLDivElement>(null)
  const theadRef = useRef<HTMLTableRowElement>(null)
  const labelCellsRef = useRef<HTMLTableCellElement[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const scrollLeft = container.scrollLeft
      // Sticky header
      if (theadRef.current) {
        theadRef.current.style.transform = `translateY(${scrollTop}px)`
      }
      // Sticky left column
      labelCellsRef.current.forEach(cell => {
        if (cell) cell.style.transform = `translateX(${scrollLeft}px)`
      })
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [loading])

  useEffect(() => {
    const fetch = async () => {
      const { data: rests } = await supabase.from('report_restaurants').select('*, report_locations(name)').order('name')
      setRestaurants(rests || [])
      const { data: weekly } = await supabase.from('report_weekly_data').select('*, report_restaurants(name, brand, report_locations(name))').order('week_start')
      const d = weekly || []
      setAllData(d)
      const weeks = [...new Set(d.map((x: any) => x.week_start))].sort() as string[]
      if (weeks.length > 0) { setFromWeek(weeks[0]); setToWeek(weeks[weeks.length-1]) }
      setLoading(false)
    }
    fetch()
  }, [])

  const locationNames = [...new Set(restaurants.map((r: any) => r.report_locations?.name).filter(Boolean))] as string[]
  const restaurantNames = restaurants.filter(r => selLocations.length===0 || selLocations.includes(r.report_locations?.name)).map(r => r.name)
  const allWeeks = [...new Set(allData.map(d => d.week_start))].sort() as string[]
  const allMonths = [...new Set(allData.map(d => d.week_start.substring(0,7)))].sort() as string[]
  const allYears = [...new Set(allData.map(d => d.week_start.substring(0,4)))].sort() as string[]

  const weekOpts = allWeeks.map((w,i) => ({ key:w, label:`Week ${i+1} — ${new Date(w).toLocaleDateString('en-AU',{day:'numeric',month:'short'})}` }))
  const monthOpts = allMonths.map(m => { const [y,mo]=m.split('-'); return { key:m, label:`${MONTH_NAMES[mo]} ${y}` } })
  const yearOpts = allYears.map(y => ({ key:y, label:y }))

  const baseFiltered = allData.filter(d => {
    const loc = d.report_restaurants?.report_locations?.name
    const rest = d.report_restaurants?.name
    return (selLocations.length===0||selLocations.includes(loc)) && (selRestaurants.length===0||selRestaurants.includes(rest))
  })

  const agg = (rows: any[]) => {
    const storeTx = rows.reduce((s,d)=>s+(parseInt(d.transactions_store)||0),0)
    const uberTx = rows.reduce((s,d)=>s+(parseInt(d.transactions_uber)||0),0)
    const ddTx = rows.reduce((s,d)=>s+(parseInt(d.transactions_doordash)||0),0)
    const totalTx = storeTx+uberTx+ddTx
    const storeRev = rows.reduce((s,d)=>s+(parseFloat(d.revenue_store_net)||0),0)
    const uberGross = rows.reduce((s,d)=>s+(parseFloat(d.revenue_uber_gross)||0),0)
    const ddGross = rows.reduce((s,d)=>s+(parseFloat(d.revenue_doordash_gross)||0),0)
    const uberNet = rows.reduce((s,d)=>s+(parseFloat(d.revenue_uber_net)||0),0)
    const ddNet = rows.reduce((s,d)=>s+(parseFloat(d.revenue_doordash_net)||0),0)
    const grossRev = storeRev+uberGross+ddGross
    const netRev = storeRev+uberNet+ddNet
    const costFood = rows.reduce((s,d)=>s+(parseFloat(d.cost_food)||0),0)
    const costStaff = rows.reduce((s,d)=>s+(parseFloat(d.cost_staff)||0),0)
    const costOp = rows.reduce((s,d)=>s+(parseFloat(d.cost_operation)||0),0)
    const totalCost = costFood+costStaff+costOp
    const grossProfit = grossRev-totalCost
    const netProfit = netRev-totalCost
    return {
      storeTx, uberTx, ddTx, totalTx,
      storeRev, uberGross, ddGross, uberNet, ddNet, grossRev, netRev,
      costFood, costStaff, costOp, totalCost, grossProfit, netProfit,
      profitPct: grossRev>0?netProfit/grossRev*100:0,
      perTx: totalTx>0?grossRev/totalTx:0,
      staffPct: grossRev>0?costStaff/grossRev*100:0,
      foodPct: grossRev>0?costFood/grossRev*100:0,
      opPct: grossRev>0?costOp/grossRev*100:0,
      foodPerTx: totalTx>0?costFood/totalTx:0,
      staffPerTx: totalTx>0?costStaff/totalTx:0,
      opPerTx: totalTx>0?costOp/totalTx:0,
      totalCostPerTx: totalTx>0?totalCost/totalTx:0,
      grossProfitPerTx: totalTx>0?grossProfit/totalTx:0,
      netProfitPerTx: totalTx>0?netProfit/totalTx:0,
      uberComm: uberGross>0?(uberGross-uberNet)/uberGross*100:0,
      ddComm: ddGross>0?(ddGross-ddNet)/ddGross*100:0,
    }
  }

  const f$ = (n:number) => n===0?'—':`$${Math.round(n).toLocaleString('en-AU')}`
  const f$d = (n:number) => n===0?'—':`$${n.toFixed(2)}`
  const fp = (n:number) => n===0?'—':`${n.toFixed(1)}%`
  const fn = (n:number) => n===0?'—':n.toLocaleString('en-AU')
  const pc = (v:number) => v>=20?'#16a34a':v>=10?'#d97706':'#dc2626'

  type Col = { key:string, label:string, sub:string, isTotal:boolean, rows:any[] }
  const columns: Col[] = []

  if (viewMode==='weekly') {
    const sel = allWeeks.filter(w=>w>=fromWeek&&w<=toWeek)
    const mMap: Record<string,string[]> = {}
    sel.forEach(w=>{ const m=w.substring(0,7); if(!mMap[m])mMap[m]=[]; mMap[m].push(w) })
    Object.entries(mMap).sort().forEach(([m,weeks])=>{
      const [y,mo]=m.split('-')
      weeks.forEach(w=>{ const idx=allWeeks.indexOf(w)+1; columns.push({ key:w, label:`Week ${idx}`, sub:new Date(w).toLocaleDateString('en-AU',{day:'numeric',month:'short'}), isTotal:false, rows:baseFiltered.filter(d=>d.week_start===w) }) })
      columns.push({ key:`t-${m}`, label:MONTH_NAMES[mo]||mo, sub:y, isTotal:true, rows:baseFiltered.filter(d=>weeks.includes(d.week_start)) })
    })
  } else if (viewMode==='monthly') {
    const months = selMonths.length>0?allMonths.filter(m=>selMonths.includes(m)):allMonths
    const yMap: Record<string,string[]> = {}
    months.forEach(m=>{ const y=m.substring(0,4); if(!yMap[y])yMap[y]=[]; yMap[y].push(m) })
    Object.entries(yMap).sort().forEach(([y,mos])=>{
      mos.forEach(m=>{ const [,mo]=m.split('-'); columns.push({ key:m, label:MONTH_NAMES[mo]||mo, sub:y, isTotal:false, rows:baseFiltered.filter(d=>d.week_start.startsWith(m)) }) })
      columns.push({ key:`t-${y}`, label:y, sub:'Annual', isTotal:true, rows:baseFiltered.filter(d=>mos.some(m=>d.week_start.startsWith(m))) })
    })
  } else {
    const years = selYears.length>0?allYears.filter(y=>selYears.includes(y)):allYears
    years.forEach(y=>{
      const mos = allMonths.filter(m=>m.startsWith(y))
      mos.forEach(m=>{ const [,mo]=m.split('-'); columns.push({ key:m, label:MONTH_NAMES[mo]||mo, sub:y, isTotal:false, rows:baseFiltered.filter(d=>d.week_start.startsWith(m)) }) })
      columns.push({ key:`t-${y}`, label:y, sub:'Annual', isTotal:true, rows:baseFiltered.filter(d=>d.week_start.startsWith(y)) })
    })
  }

  type Row = { section:string }|{ label:string, get:(d:ReturnType<typeof agg>)=>string, indent?:boolean, bold?:boolean, muted?:boolean, color?:(d:ReturnType<typeof agg>)=>string }

  const rows: Row[] = [
    { section:'Summary' },
    { label:'Total # Transactions', get:d=>fn(d.totalTx) },
    { label:'Per Transaction Revenue', get:d=>f$d(d.perTx) },
    { label:'Staff Cost %', get:d=>fp(d.staffPct), indent:true },
    { label:'Food Cost %', get:d=>fp(d.foodPct), indent:true },
    { label:'Operation Cost %', get:d=>fp(d.opPct), indent:true },
    { section:'Revenue' },
    { label:'Store Revenue', get:d=>f$(d.storeRev), indent:true },
    { label:'Total Gross Revenue', get:d=>f$(d.grossRev), bold:true },
    { label:'Total Net Revenue', get:d=>f$(d.netRev), bold:true },
    { section:'Costs' },
    { label:'Food Cost', get:d=>f$(d.costFood), indent:true },
    { label:'Per Transaction', get:d=>f$d(d.foodPerTx), indent:true, muted:true },
    { label:'Staff Cost', get:d=>f$(d.costStaff), indent:true },
    { label:'Per Transaction', get:d=>f$d(d.staffPerTx), indent:true, muted:true },
    { label:'Operation Cost', get:d=>f$(d.costOp), indent:true },
    { label:'Per Transaction', get:d=>f$d(d.opPerTx), indent:true, muted:true },
    { label:'Total Cost', get:d=>f$(d.totalCost), bold:true },
    { label:'Per Transaction', get:d=>f$d(d.totalCostPerTx), bold:true, muted:true },
    { section:'Profit' },
    { label:'Gross Profit', get:d=>f$(d.grossProfit), bold:true, color:d=>d.grossProfit>=0?'#16a34a':'#dc2626' },
    { label:'Per Transaction', get:d=>f$d(d.grossProfitPerTx), muted:true, color:d=>d.grossProfitPerTx>=0?'#16a34a':'#dc2626' },
    { label:'Net Profit', get:d=>f$(d.netProfit), bold:true, color:d=>d.netProfit>=0?'#16a34a':'#dc2626' },
    { label:'Per Transaction', get:d=>f$d(d.netProfitPerTx), muted:true, color:d=>d.netProfitPerTx>=0?'#16a34a':'#dc2626' },
    { label:'Profit %', get:d=>fp(d.profitPct), color:d=>pc(d.profitPct) },
    { section:'Transactions' },
    { label:'Store', get:d=>fn(d.storeTx), indent:true },
    { label:'Uber Eats', get:d=>fn(d.uberTx), indent:true },
    { label:'DoorDash', get:d=>fn(d.ddTx), indent:true },
    { label:'Total', get:d=>fn(d.totalTx), bold:true },
    { section:'Delivery Partners' },
    { label:'Uber Eats Gross', get:d=>f$(d.uberGross), indent:true },
    { label:'Uber Eats Net', get:d=>f$(d.uberNet), indent:true },
    { label:'Commission %', get:d=>fp(d.uberComm), indent:true, muted:true, color:_d=>'#dc2626' },
    { label:'DoorDash Gross', get:d=>f$(d.ddGross), indent:true },
    { label:'DoorDash Net', get:d=>f$(d.ddNet), indent:true },
    { label:'Commission %', get:d=>fp(d.ddComm), indent:true, muted:true, color:_d=>'#dc2626' },
  ]

  const W_LABEL = 205
  const W_COL = 95
  const W_TOTAL = 110
  const BG = '#ffffff'
  const BG2 = '#f7f7f7'
  const SEC_BG = '#f0f0ee'
  const M_BG = '#FFF3B0'
  const M_COLOR = '#7A5F00'
  const M_BORDER = '#D4A900'

  let labelIdx = 0
  const setLabelRef = (el: HTMLTableCellElement | null) => {
    if (el) labelCellsRef.current[labelIdx++] = el
  }

  if (loading) return <div style={{padding:40,textAlign:'center',color:'var(--color-text-secondary)'}}>Loading...</div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10,height:'100%'}}>

      {/* Toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',padding:'10px 14px',background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:12,flexShrink:0}}>
        <Dropdown label="Weekly" options={[{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'},{key:'yearly',label:'Yearly'}]} selected={[viewMode]} onChange={v=>{setViewMode(v[0]);setSelMonths([]);setSelYears([])}} />
        <div style={{width:1,height:20,background:'var(--color-border-tertiary)'}}/>
        <Dropdown label="Locations" options={locationNames.map(l=>({key:l,label:l}))} selected={selLocations} multi onChange={v=>{setSelLocations(v);setSelRestaurants([])}} />
        <Dropdown label="Restaurants" options={restaurantNames.map(r=>({key:r,label:r}))} selected={selRestaurants} multi onChange={setSelRestaurants} />
        <div style={{width:1,height:20,background:'var(--color-border-tertiary)'}}/>
        {viewMode==='weekly' && <>
          <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>From</span>
          <Dropdown label="From" options={weekOpts} selected={[fromWeek]} onChange={v=>setFromWeek(v[0])} />
          <span style={{fontSize:11,color:'var(--color-text-secondary)'}}>To</span>
          <Dropdown label="To" options={weekOpts} selected={[toWeek]} onChange={v=>setToWeek(v[0])} />
        </>}
        {viewMode==='monthly' && <Dropdown label="Months" options={monthOpts} selected={selMonths} multi onChange={setSelMonths} />}
        {viewMode==='yearly' && <Dropdown label="Years" options={yearOpts} selected={selYears} multi onChange={setSelYears} />}
        {(selLocations.length>0||selRestaurants.length>0) && <button onClick={()=>{setSelLocations([]);setSelRestaurants([])}} style={{padding:'5px 12px',border:'0.5px solid #ffcccc',borderRadius:20,background:'#fff5f5',color:'#cc0000',fontSize:12,cursor:'pointer'}}>Clear</button>}
      </div>

      {/* Scrollable table container */}
      <div
        ref={containerRef}
        style={{
          flex:1,
          overflow:'auto',
          borderRadius:12,
          border:'0.5px solid #e0e0e0',
          background:BG,
        }}
      >
        <table style={{borderCollapse:'collapse',fontSize:12,tableLayout:'fixed',width:`${W_LABEL+columns.reduce((s,c)=>s+(c.isTotal?W_TOTAL:W_COL),0)}px`}}>
          <colgroup>
            <col style={{width:W_LABEL}}/>
            {columns.map((c,i)=><col key={i} style={{width:c.isTotal?W_TOTAL:W_COL}}/>)}
          </colgroup>
          <thead>
            <tr ref={theadRef} style={{willChange:'transform'}}>
              <th ref={el=>setLabelRef(el)} style={{textAlign:'left',width:W_LABEL,minWidth:W_LABEL,padding:'6px 12px',fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',background:BG,borderBottom:'2px solid #d0d0d0',borderRight:'2px solid #d0d0d0',willChange:'transform',zIndex:1}}>
              </th>
              {columns.map((col,i)=>(
                <th key={i} style={{textAlign:'right',padding:'6px 10px',fontSize:11,fontWeight:500,whiteSpace:'nowrap',borderBottom:'2px solid #d0d0d0',background:col.isTotal?M_BG:BG,color:col.isTotal?M_COLOR:'var(--color-text-secondary)',borderLeft:col.isTotal?`1px solid ${M_BORDER}`:'none',borderRight:col.isTotal?`1px solid ${M_BORDER}`:'none'}}>
                  <div>{col.label}</div>
                  <div style={{fontWeight:400,fontSize:10,color:col.isTotal?M_COLOR:'var(--color-text-secondary)'}}>{col.sub}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(() => { labelIdx = 0; return null })()}
            {rows.map((row,ri)=>{
              if ('section' in row) {
                return (
                  <tr key={ri}>
                    <td ref={el=>setLabelRef(el)} colSpan={columns.length+1} style={{background:SEC_BG,fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',color:'#666',borderTop:'5px solid #f5f5f5',padding:'7px 12px 5px',willChange:'transform',borderRight:'2px solid #d0d0d0'}}>
                      {row.section}
                    </td>
                  </tr>
                )
              }
              const isBold = 'bold' in row && row.bold
              const isMuted = 'muted' in row && row.muted
              const isIndent = 'indent' in row && row.indent
              return (
                <tr key={ri}>
                  <td ref={el=>setLabelRef(el)} style={{textAlign:'left',width:W_LABEL,minWidth:W_LABEL,padding:'5px 12px',paddingLeft:isIndent?22:12,fontWeight:isBold?600:400,background:isBold?BG2:BG,color:isMuted?'#999':isIndent?'#777':'var(--color-text-primary)',fontSize:isMuted?11:12,borderBottom:'0.5px solid #ebebeb',borderRight:'2px solid #d0d0d0',willChange:'transform',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {row.label}
                  </td>
                  {columns.map((col,ci)=>{
                    const d = agg(col.rows)
                    const val = row.get(d)
                    const color = 'color' in row && row.color ? row.color(d) : col.isTotal ? M_COLOR : 'var(--color-text-primary)'
                    return (
                      <td key={ci} style={{textAlign:'right',padding:'5px 10px',whiteSpace:'nowrap',borderBottom:'0.5px solid #ebebeb',background:isBold?(col.isTotal?M_BG:BG2):(col.isTotal?'#FFFDE8':'transparent'),color,fontWeight:isBold||col.isTotal?600:400,borderLeft:col.isTotal?`1px solid ${M_BORDER}`:'none',borderRight:col.isTotal?`1px solid ${M_BORDER}`:'none',fontSize:isMuted?11:12}}>
                        {val}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
