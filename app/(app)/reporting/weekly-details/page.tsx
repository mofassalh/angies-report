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
      <button ref={btnRef} onClick={handleOpen} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', border:`0.5px solid ${hasVal?'#D4A900':'#d0d0d0'}`, borderRadius:20, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', background:hasVal?'#FFF3B0':'#fff', color:hasVal?'#7A5F00':'#666', fontWeight:hasVal?500:400 }}>
        {dispLabel}
        {hasVal && multi && <span onClick={e=>{e.stopPropagation();onChange([])}} style={{marginLeft:2,fontSize:11}}>✕</span>}
        <ChevronDown size={12}/>
      </button>
      {open && (
        <div ref={menuRef} style={{ position:'fixed', top:menuPos.top, left:menuPos.left, zIndex:99999, minWidth:220, background:'#fff', border:'0.5px solid #d0d0d0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', maxHeight:280, overflowY:'auto' }}>
          {multi && <div onClick={()=>onChange([])} style={{ padding:'9px 14px', fontSize:12, cursor:'pointer', background:selected.length===0?'#FFF3B0':'transparent', color:selected.length===0?'#7A5F00':'#333', fontWeight:selected.length===0?500:400 }}>All {label}</div>}
          {options.map(opt => { const isSel = selected.includes(opt.key); return (
            <div key={opt.key} onClick={()=>toggle(opt.key)} style={{ padding:'9px 14px', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:8, background:isSel?'#FFF3B0':'transparent', color:isSel?'#7A5F00':'#333' }}>
              {multi && <div style={{ width:14, height:14, border:`1.5px solid ${isSel?'#D4A900':'#ccc'}`, borderRadius:3, background:isSel?'#D4A900':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{isSel && <span style={{fontSize:9,color:'#1A1A1A',fontWeight:700}}>✓</span>}</div>}
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
  const pc=(v:number)=>v>=20?'#16a34a':v>=10?'#d97706':'#dc2626'

  type Col = { key:string,label:string,sub:string,isTotal:boolean,rows:any[] }
  const columns: Col[] = []
  if (viewMode==='weekly') {
    const sel=allWeeks.filter(w=>w>=fromWeek&&w<=toWeek), mMap:Record<string,string[]>={}
    sel.forEach(w=>{const m=w.substring(0,7);if(!mMap[m])mMap[m]=[];mMap[m].push(w)})
    Object.entries(mMap).sort().forEach(([m,weeks])=>{
      const [y,mo]=m.split('-')
      weeks.forEach(w=>{const idx=allWeeks.indexOf(w)+1;columns.push({key:w,label:`Week ${idx}`,sub:new Date(w+'T00:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'}),isTotal:false,rows:baseFiltered.filter(d=>d.week_start===w)})})
      columns.push({key:`t-${m}`,label:MONTH_NAMES[mo]||mo,sub:y,isTotal:true,rows:baseFiltered.filter(d=>weeks.includes(d.week_start))})
    })
  } else if (viewMode==='monthly') {
    const months=selMonths.length>0?allMonths.filter(m=>selMonths.includes(m)):allMonths, yMap:Record<string,string[]>={}
    months.forEach(m=>{const y=m.substring(0,4);if(!yMap[y])yMap[y]=[];yMap[y].push(m)})
    Object.entries(yMap).sort().forEach(([y,mos])=>{
      mos.forEach(m=>{const [,mo]=m.split('-');columns.push({key:m,label:MONTH_NAMES[mo]||mo,sub:y,isTotal:false,rows:baseFiltered.filter(d=>d.week_start.startsWith(m))})})
      columns.push({key:`t-${y}`,label:y,sub:'Annual',isTotal:true,rows:baseFiltered.filter(d=>mos.some(m=>d.week_start.startsWith(m)))})
    })
  } else {
    const years=selYears.length>0?allYears.filter(y=>selYears.includes(y)):allYears
    years.forEach(y=>{
      const mos=allMonths.filter(m=>m.startsWith(y))
      mos.forEach(m=>{const [,mo]=m.split('-');columns.push({key:m,label:MONTH_NAMES[mo]||mo,sub:y,isTotal:false,rows:baseFiltered.filter(d=>d.week_start.startsWith(m))})})
      columns.push({key:`t-${y}`,label:y,sub:'Annual',isTotal:true,rows:baseFiltered.filter(d=>d.week_start.startsWith(y))})
    })
  }

  type Row = {section:string}|{label:string,get:(d:ReturnType<typeof agg>)=>string,indent?:boolean,bold?:boolean,muted?:boolean,color?:(d:ReturnType<typeof agg>)=>string}
  const rows: Row[] = [
    {section:'Summary'},{label:'Total # Transactions',get:d=>fn(d.totalTx)},{label:'Per Transaction Revenue',get:d=>f$d(d.perTx)},
    {label:'Staff Cost %',get:d=>fp(d.staffPct),indent:true},{label:'Food Cost %',get:d=>fp(d.foodPct),indent:true},{label:'Operation Cost %',get:d=>fp(d.opPct),indent:true},
    {section:'Revenue'},{label:'Store Revenue',get:d=>f$(d.storeRev),indent:true},{label:'Total Gross Revenue',get:d=>f$(d.grossRev),bold:true},{label:'Total Net Revenue',get:d=>f$(d.netRev),bold:true},
    {section:'Costs'},{label:'Food Cost',get:d=>f$(d.costFood),indent:true},{label:'Per Transaction',get:d=>f$d(d.foodPerTx),indent:true,muted:true},
    {label:'Staff Cost',get:d=>f$(d.costStaff),indent:true},{label:'Per Transaction',get:d=>f$d(d.staffPerTx),indent:true,muted:true},
    {label:'Operation Cost',get:d=>f$(d.costOp),indent:true},{label:'Per Transaction',get:d=>f$d(d.opPerTx),indent:true,muted:true},
    {label:'Total Cost',get:d=>f$(d.totalCost),bold:true},{label:'Per Transaction',get:d=>f$d(d.totalCostPerTx),bold:true,muted:true},
    {section:'Profit'},{label:'Gross Profit',get:d=>f$(d.grossProfit),bold:true,color:d=>d.grossProfit>=0?'#16a34a':'#dc2626'},
    {label:'Per Transaction',get:d=>f$d(d.grossProfitPerTx),muted:true,color:d=>d.grossProfitPerTx>=0?'#16a34a':'#dc2626'},
    {label:'Net Profit',get:d=>f$(d.netProfit),bold:true,color:d=>d.netProfit>=0?'#16a34a':'#dc2626'},
    {label:'Per Transaction',get:d=>f$d(d.netProfitPerTx),muted:true,color:d=>d.netProfitPerTx>=0?'#16a34a':'#dc2626'},
    {label:'Profit %',get:d=>fp(d.profitPct),color:d=>pc(d.profitPct)},
    {section:'Transactions'},{label:'Store',get:d=>fn(d.storeTx),indent:true},{label:'Uber Eats',get:d=>fn(d.uberTx),indent:true},{label:'DoorDash',get:d=>fn(d.ddTx),indent:true},{label:'Total',get:d=>fn(d.totalTx),bold:true},
    {section:'Delivery Partners'},{label:'Uber Eats Gross',get:d=>f$(d.uberGross),indent:true},{label:'Uber Eats Net',get:d=>f$(d.uberNet),indent:true},
    {label:'Commission %',get:d=>fp(d.uberComm),indent:true,muted:true,color:_d=>'#dc2626'},
    {label:'DoorDash Gross',get:d=>f$(d.ddGross),indent:true},{label:'DoorDash Net',get:d=>f$(d.ddNet),indent:true},
    {label:'Commission %',get:d=>fp(d.ddComm),indent:true,muted:true,color:_d=>'#dc2626'},
  ]

  const W=205, MB='#FFF3B0', MC='#7A5F00', MBR='#D4A900'

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f5'}}>
      <div style={{width:24,height:24,borderRadius:'50%',border:'2px solid #F5C800',borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',background:'#f5f5f5',fontFamily:'var(--font-sans, system-ui)'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',padding:'10px 14px',background:'#fff',border:'0.5px solid #e0e0e0',borderRadius:12,flexShrink:0,marginBottom:12}}>
        <Dropdown label="Weekly" options={[{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'},{key:'yearly',label:'Yearly'}]} selected={[viewMode]} onChange={v=>{setViewMode(v[0]);setSelMonths([]);setSelYears([])}} />
        <div style={{width:1,height:20,background:'#e0e0e0'}}/>
        <Dropdown label="Locations" options={locationNames.map(l=>({key:l,label:l}))} selected={selLocations} multi onChange={v=>{setSelLocations(v);setSelRestaurants([])}} />
        <Dropdown label="Restaurants" options={restaurantNames.map(r=>({key:r,label:r}))} selected={selRestaurants} multi onChange={setSelRestaurants} />
        <div style={{width:1,height:20,background:'#e0e0e0'}}/>
        {viewMode==='weekly' && <><span style={{fontSize:11,color:'#888'}}>From</span><Dropdown label="From" options={weekOpts} selected={[fromWeek]} onChange={v=>setFromWeek(v[0])} /><span style={{fontSize:11,color:'#888'}}>To</span><Dropdown label="To" options={weekOpts} selected={[toWeek]} onChange={v=>setToWeek(v[0])} /></>}
        {viewMode==='monthly' && <Dropdown label="Months" options={monthOpts} selected={selMonths} multi onChange={setSelMonths} />}
        {viewMode==='yearly' && <Dropdown label="Years" options={yearOpts} selected={selYears} multi onChange={setSelYears} />}
        {(selLocations.length>0||selRestaurants.length>0) && <button onClick={()=>{setSelLocations([]);setSelRestaurants([])}} style={{padding:'5px 12px',border:'0.5px solid #ffcccc',borderRadius:20,background:'#fff5f5',color:'#cc0000',fontSize:12,cursor:'pointer'}}>Clear</button>}
      </div>
      <div style={{flex:1,overflow:'auto',border:'0.5px solid #e0e0e0',background:'#fff'}}>
        <table style={{borderCollapse:'collapse',fontSize:12,tableLayout:'fixed',width:`${W+columns.reduce((s,c)=>s+(c.isTotal?110:95),0)}px`}}>
          <colgroup><col style={{width:W}}/>{columns.map((_,i)=><col key={i} style={{width:columns[i].isTotal?110:95}}/>)}</colgroup>
          <thead>
            <tr>
              <th style={{position:'sticky',top:0,left:0,zIndex:20,width:W,minWidth:W,background:'#fff',borderBottom:'2px solid #d0d0d0',borderRight:'2px solid #d0d0d0',textAlign:'left',padding:'6px 12px',fontSize:11,fontWeight:500,color:'#888'}}></th>
              {columns.map((col,i)=>(
                <th key={i} style={{position:'sticky',top:0,zIndex:10,textAlign:'right',padding:'6px 10px',fontSize:11,fontWeight:500,whiteSpace:'nowrap',borderBottom:'2px solid #d0d0d0',background:col.isTotal?MB:'#FFF9E0',color:col.isTotal?MC:'#7A5F00',borderLeft:col.isTotal?`1px solid ${MBR}`:'none',borderRight:col.isTotal?`1px solid ${MBR}`:'none'}}>
                  <div>{col.label}</div><div style={{fontWeight:400,fontSize:10,color:col.isTotal?MC:'#aaa'}}>{col.sub}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row,ri)=>{
              if('section' in row) return (
                <tr key={ri}>
                  <td style={{position:'sticky',left:0,zIndex:6,width:205,minWidth:205,background:'#f0f0ee',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',color:'#666',borderTop:'5px solid #f5f5f5',padding:'7px 12px 5px',whiteSpace:'nowrap',borderRight:'2px solid #e0e0e0'}}>{row.section}</td>
                  {columns.map((_,ci)=><td key={ci} style={{background:'#f0f0ee',borderTop:'5px solid #f5f5f5',borderBottom:'0.5px solid #ebebeb'}}/>)}
                </tr>
              )
              const isBold='bold' in row&&row.bold, isMuted='muted' in row&&row.muted, isIndent='indent' in row&&row.indent
              return (
                <tr key={ri}>
                  <td style={{position:'sticky',left:0,zIndex:5,width:W,minWidth:W,background:isBold?'#f7f7f7':'#fff',borderRight:'2px solid #e0e0e0',textAlign:'left',padding:'5px 12px',paddingLeft:isIndent?22:12,fontWeight:isBold?600:400,color:isMuted?'#999':isIndent?'#777':'#1A1A1A',fontSize:isMuted?11:12,borderBottom:'0.5px solid #ebebeb',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{row.label}</td>
                  {columns.map((col,ci)=>{
                    const d=agg(col.rows), val=row.get(d), color='color' in row&&row.color?row.color(d):col.isTotal?MC:'#1A1A1A'
                    return <td key={ci} style={{textAlign:'right',padding:'5px 10px',whiteSpace:'nowrap',borderBottom:'0.5px solid #ebebeb',background:isBold?(col.isTotal?MB:'#f7f7f7'):(col.isTotal?'#FFFDE8':'transparent'),color,fontWeight:isBold||col.isTotal?600:400,borderLeft:col.isTotal?`1px solid ${MBR}`:'none',borderRight:col.isTotal?`1px solid ${MBR}`:'none',fontSize:isMuted?11:12}}>{val}</td>
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
