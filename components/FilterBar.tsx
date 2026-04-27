'use client'
import { useFilters } from './FilterContext'
import { useRef, useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, { title: string, sub: string }> = {
  '/dashboard/revenue':   { title: 'Revenue Analysis',     sub: 'Channel & weekly breakdown' },
  '/dashboard/cost':      { title: 'Cost Analysis',        sub: 'Food, staff & operations' },
  '/dashboard/pl':        { title: 'P&L Summary',          sub: 'Profit & loss overview' },
  '/dashboard/location':  { title: 'Location Wise',        sub: 'Performance by location' },
  '/sales/channel':       { title: 'Channel Performance',  sub: 'Store vs delivery platforms' },
  '/sales/transactions':  { title: 'Transaction Analysis', sub: 'Order volume & trends' },
  '/sales/growth':        { title: 'Growth Trends',        sub: 'Week over week growth' },
}

function MultiDropdown({ label, options, selected, onChange }: {
  label: string, options: {key:string,label:string}[], selected: string[], onChange: (v:string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top:0, left:0 })
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
      setMenuPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }
  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter(s => s !== key) : [...selected, key])
  }
  const hasVal = selected.length > 0
  const dispLabel = !hasVal ? `All ${label}` : `${selected.length} ${label}`
  return (
    <>
      <button ref={btnRef} onClick={handleOpen} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', border:`0.5px solid ${hasVal?'#D4A900':'#d0d0d0'}`, borderRadius:20, fontSize:12, cursor:'pointer', whiteSpace:'nowrap', background:hasVal?'#FFF3B0':'#fff', color:hasVal?'#7A5F00':'#666', fontWeight:hasVal?500:400 }}>
        {dispLabel}
        {hasVal && <span onClick={e=>{e.stopPropagation();onChange([])}} style={{fontSize:11,marginLeft:2}}>✕</span>}
        <ChevronDown size={12}/>
      </button>
      {open && (
        <div ref={menuRef} style={{ position:'fixed', top:menuPos.top, left:menuPos.left, zIndex:99999, minWidth:200, background:'#fff', border:'0.5px solid #d0d0d0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', maxHeight:280, overflowY:'auto' }}>
          <div onClick={()=>onChange([])} style={{ padding:'9px 14px', fontSize:12, cursor:'pointer', background:selected.length===0?'#FFF3B0':'transparent', color:selected.length===0?'#7A5F00':'#333', fontWeight:selected.length===0?500:400 }}>All {label}</div>
          {options.map(opt => {
            const isSel = selected.includes(opt.key)
            return (
              <div key={opt.key} onClick={()=>toggle(opt.key)} style={{ padding:'9px 14px', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:8, background:isSel?'#FFF3B0':'transparent', color:isSel?'#7A5F00':'#333' }}>
                <div style={{ width:14, height:14, border:`1.5px solid ${isSel?'#D4A900':'#ccc'}`, borderRadius:3, background:isSel?'#D4A900':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {isSel && <span style={{fontSize:9,color:'#1A1A1A',fontWeight:700}}>✓</span>}
                </div>
                {opt.label}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function FilterBar() {
  const { filters, setFilters, locations, restaurants, availableMonths } = useFilters()
  const pathname = usePathname()
  const pageInfo = PAGE_TITLES[pathname]
  const locationOpts = locations.map(l => ({ key:l, label:l }))
  const restaurantOpts = restaurants.map(r => ({ key:r.name, label:r.name }))
  const monthOpts = availableMonths.map(m => ({ key:m.key, label:m.label }))
  const hasAny = filters.locations.length>0 || filters.restaurants.length>0 || filters.months.length>0
  return (
    <div style={{ background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60, flexShrink:0 }}>
      <div>
        {pageInfo && <>
          <div style={{ fontSize:18, fontWeight:700, color:'#1a1a1a', lineHeight:1.2 }}>{pageInfo.title}</div>
          <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>{pageInfo.sub}</div>
        </>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
        <MultiDropdown label="Months" options={monthOpts} selected={filters.months||[]} onChange={v=>setFilters({months:v})} />
        <div style={{width:1,height:20,background:'#e5e5e5'}}/>
        <MultiDropdown label="Locations" options={locationOpts} selected={filters.locations} onChange={v=>setFilters({locations:v})} />
        <MultiDropdown label="Restaurants" options={restaurantOpts} selected={filters.restaurants} onChange={v=>setFilters({restaurants:v})} />
        {hasAny && (
          <button onClick={()=>setFilters({locations:[],restaurants:[],months:[]})} style={{ padding:'6px 12px', border:'0.5px solid #ffcccc', borderRadius:20, background:'#fff5f5', color:'#cc0000', fontSize:12, cursor:'pointer' }}>
            Clear ✕
          </button>
        )}
      </div>
    </div>
  )
}
