'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ChevronDown } from 'lucide-react'

function MultiSelect({ label, options, selected, onChange }: {
  label: string, options: string[], selected: string[], onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v])
  const allSelected = selected.length === 0
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 20, background: allSelected ? 'var(--color-background-primary)' : '#FFF9E0', color: allSelected ? 'var(--color-text-secondary)' : '#b8860b', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: allSelected ? 400 : 500 }}>
        <span>{allSelected ? `All ${label}` : `${selected.length} selected`}</span>
        {!allSelected && <span onClick={e => { e.stopPropagation(); onChange([]) }} style={{ marginLeft: 2 }}>✕</span>}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, marginTop: 4, minWidth: 200, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          <div onClick={() => onChange([])} style={{ padding: '9px 14px', fontSize: 12, cursor: 'pointer', background: allSelected ? '#FFF9E0' : 'transparent', color: allSelected ? '#b8860b' : 'var(--color-text-primary)', fontWeight: allSelected ? 500 : 400 }}>All {label}</div>
          {options.map(opt => (
            <div key={opt} onClick={() => toggle(opt)} style={{ padding: '9px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: selected.includes(opt) ? '#FFF9E0' : 'transparent', color: selected.includes(opt) ? '#b8860b' : 'var(--color-text-primary)' }}>
              <div style={{ width: 14, height: 14, border: `1.5px solid ${selected.includes(opt) ? '#F5C800' : 'var(--color-border-secondary)'}`, borderRadius: 3, background: selected.includes(opt) ? '#F5C800' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selected.includes(opt) && <span style={{ fontSize: 9, color: '#1A1A1A', fontWeight: 700 }}>✓</span>}
              </div>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SingleSelect({ options, value, onChange }: {
  options: {key: string, label: string}[], value: string, onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const selected = options.find(o => o.key === value)
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', border: '0.5px solid #F5C800', borderRadius: 20, background: '#FFF9E0', color: '#b8860b', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500 }}>
        <span>{selected?.label || '—'}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, marginTop: 4, minWidth: 220, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 10, overflow: 'hidden', maxHeight: 260, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {options.map(opt => (
            <div key={opt.key} onClick={() => { onChange(opt.key); setOpen(false) }} style={{ padding: '9px 14px', fontSize: 12, cursor: 'pointer', background: value === opt.key ? '#FFF9E0' : 'transparent', color: value === opt.key ? '#b8860b' : 'var(--color-text-primary)', fontWeight: value === opt.key ? 500 : 400 }}>
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ReportingPage() {
  const [allData, setAllData] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'weekly'|'monthly'|'yearly'>('weekly')
  const [selLocations, setSelLocations] = useState<string[]>([])
  const [selRestaurants, setSelRestaurants] = useState<string[]>([])
  const [fromWeek, setFromWeek] = useState<string>('')
  const [toWeek, setToWeek] = useState<string>('')
  const [selMonths, setSelMonths] = useState<string[]>([])
  const [selYears, setSelYears] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: rests } = await supabase.from('report_restaurants').select('*, report_locations(name)').order('name')
      setRestaurants(rests || [])
      const { data: weekly } = await supabase.from('report_weekly_data').select('*, report_restaurants(name, brand, report_locations(name))').order('week_start')
      const d = weekly || []
      setAllData(d)
      const weeks = [...new Set(d.map((x: any) => x.week_start))].sort() as string[]
      if (weeks.length > 0) { setFromWeek(weeks[0]); setToWeek(weeks[weeks.length - 1]) }
      setLoading(false)
    }
    fetchData()
  }, [])

  const locationNames = [...new Set(restaurants.map((r: any) => r.report_locations?.name).filter(Boolean))] as string[]
  const restaurantNames = restaurants.filter(r => selLocations.length === 0 || selLocations.includes(r.report_locations?.name)).map(r => r.name)

  const baseFiltered = allData.filter(d => {
    const loc = d.report_restaurants?.report_locations?.name
    const rest = d.report_restaurants?.name
    return (selLocations.length === 0 || selLocations.includes(loc)) && (selRestaurants.length === 0 || selRestaurants.includes(rest))
  })

  const allWeeks = [...new Set(allData.map(d => d.week_start))].sort() as string[]
  const allMonths = [...new Set(allData.map(d => d.week_start.substring(0,7)))].sort() as string[]
  const allYears = [...new Set(allData.map(d => d.week_start.substring(0,4)))].sort() as string[]

  const weekOptions = allWeeks.map((w, i) => ({
    key: w,
    label: `Week ${i+1} — ${new Date(w).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`
  }))

  const MONTH_NAMES: Record<string, string> = { '01':'January','02':'February','03':'March','04':'April','05':'May','06':'June','07':'July','08':'August','09':'September','10':'October','11':'November','12':'December' }

  const monthOptions = allMonths.map(m => {
    const [year, month] = m.split('-')
    return { key: m, label: `${MONTH_NAMES[month]} ${year}` }
  })

  const agg = (rows: any[]) => {
    const storeTx = rows.reduce((s, d) => s + (parseInt(d.transactions_store) || 0), 0)
    const uberTx = rows.reduce((s, d) => s + (parseInt(d.transactions_uber) || 0), 0)
    const ddTx = rows.reduce((s, d) => s + (parseInt(d.transactions_doordash) || 0), 0)
    const totalTx = storeTx + uberTx + ddTx
    const storeRev = rows.reduce((s, d) => s + (parseFloat(d.revenue_store_net) || 0), 0)
    const uberRev = rows.reduce((s, d) => s + (parseFloat(d.revenue_uber_gross) || 0), 0)
    const ddRev = rows.reduce((s, d) => s + (parseFloat(d.revenue_doordash_gross) || 0), 0)
    const grossRev = storeRev + uberRev + ddRev
    const uberNet = rows.reduce((s, d) => s + (parseFloat(d.revenue_uber_net) || 0), 0)
    const ddNet = rows.reduce((s, d) => s + (parseFloat(d.revenue_doordash_net) || 0), 0)
    const netRev = storeRev + uberNet + ddNet
    const costFood = rows.reduce((s, d) => s + (parseFloat(d.cost_food) || 0), 0)
    const costStaff = rows.reduce((s, d) => s + (parseFloat(d.cost_staff) || 0), 0)
    const costOp = rows.reduce((s, d) => s + (parseFloat(d.cost_operation) || 0), 0)
    const totalCost = costFood + costStaff + costOp
    const grossProfit = grossRev - totalCost
    const netProfit = netRev - totalCost
    const profitPct = grossRev > 0 ? netProfit / grossRev * 100 : 0
    const perTx = totalTx > 0 ? grossRev / totalTx : 0
    const staffPct = grossRev > 0 ? costStaff / grossRev * 100 : 0
    const foodPct = grossRev > 0 ? costFood / grossRev * 100 : 0
    const opPct = grossRev > 0 ? costOp / grossRev * 100 : 0
    return { storeTx, uberTx, ddTx, totalTx, storeRev, uberRev, ddRev, grossRev, netRev, costFood, costStaff, costOp, totalCost, grossProfit, netProfit, profitPct, perTx, staffPct, foodPct, opPct }
  }

  const fmt = (n: number) => n === 0 ? '—' : `$${Math.round(n).toLocaleString('en-AU')}`
  const fmtPct = (n: number) => n === 0 ? '—' : `${n.toFixed(1)}%`
  const fmtN = (n: number) => n === 0 ? '—' : n.toLocaleString('en-AU')
  const getProfitColor = (val: number) => val >= 20 ? '#16a34a' : val >= 10 ? '#d97706' : '#dc2626'

  const tableRows = [
    { section: 'Summary' },
    { key: 'totalTx', label: 'Total # Transactions', format: fmtN },
    { key: 'perTx', label: 'Per Transaction Revenue', format: fmt },
    { key: 'staffPct', label: 'Staff Cost %', format: fmtPct },
    { key: 'foodPct', label: 'Food Cost %', format: fmtPct },
    { key: 'opPct', label: 'Operation Cost %', format: fmtPct },
    { section: 'Revenue' },
    { key: 'grossRev', label: 'Total Gross Revenue', format: fmt },
    { key: 'netRev', label: 'Total Net Revenue', format: fmt },
    { section: 'Costs' },
    { key: 'costFood', label: 'Food', format: fmt, indent: true },
    { key: 'costStaff', label: 'Staff', format: fmt, indent: true },
    { key: 'costOp', label: 'Operation', format: fmt, indent: true },
    { key: 'totalCost', label: 'Total Cost', format: fmt, bold: true },
    { section: 'Profit' },
    { key: 'grossProfit', label: 'Gross Profit', format: fmt, profit: true, bold: true },
    { key: 'netProfit', label: 'Net Profit', format: fmt, profit: true, bold: true },
    { key: 'profitPct', label: 'Profit %', format: fmtPct, profitPct: true },
    { section: 'Transactions' },
    { key: 'storeTx', label: 'Store', format: fmtN, indent: true },
    { key: 'uberTx', label: 'Uber Eats', format: fmtN, indent: true },
    { key: 'ddTx', label: 'DoorDash', format: fmtN, indent: true },
  ]

  type Col = { key: string, label: string, sub: string, isTotal: boolean, rows: any[] }
  let columns: Col[] = []

  if (viewMode === 'weekly') {
    const selectedWeeks = allWeeks.filter(w => w >= fromWeek && w <= toWeek)
    const monthMap: Record<string, string[]> = {}
    selectedWeeks.forEach(w => {
      const m = w.substring(0, 7)
      if (!monthMap[m]) monthMap[m] = []
      monthMap[m].push(w)
    })
    Object.entries(monthMap).sort().forEach(([month, weeks]) => {
      const [year, mo] = month.split('-')
      weeks.forEach(w => {
        const idx = allWeeks.indexOf(w) + 1
        columns.push({ key: w, label: `Week ${idx}`, sub: new Date(w).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), isTotal: false, rows: baseFiltered.filter(d => d.week_start === w) })
      })
      columns.push({ key: `total-${month}`, label: MONTH_NAMES[mo] || mo, sub: year, isTotal: true, rows: baseFiltered.filter(d => weeks.includes(d.week_start)) })
    })
  } else if (viewMode === 'monthly') {
    const months = selMonths.length > 0 ? allMonths.filter(m => selMonths.includes(m)) : allMonths
    const yearMap: Record<string, string[]> = {}
    months.forEach(m => { const y = m.substring(0,4); if (!yearMap[y]) yearMap[y] = []; yearMap[y].push(m) })
    Object.entries(yearMap).sort().forEach(([year, mos]) => {
      mos.forEach(m => {
        const [y, mo] = m.split('-')
        columns.push({ key: m, label: MONTH_NAMES[mo] || mo, sub: y, isTotal: false, rows: baseFiltered.filter(d => d.week_start.startsWith(m)) })
      })
      columns.push({ key: `total-${year}`, label: year, sub: 'Annual', isTotal: true, rows: baseFiltered.filter(d => mos.some(m => d.week_start.startsWith(m))) })
    })
  } else {
    const years = selYears.length > 0 ? allYears.filter(y => selYears.includes(y)) : allYears
    years.forEach(y => {
      const months = allMonths.filter(m => m.startsWith(y))
      months.forEach(m => {
        const [yr, mo] = m.split('-')
        columns.push({ key: m, label: MONTH_NAMES[mo] || mo, sub: yr, isTotal: false, rows: baseFiltered.filter(d => d.week_start.startsWith(m)) })
      })
      columns.push({ key: `total-${y}`, label: y, sub: 'Annual', isTotal: true, rows: baseFiltered.filter(d => d.week_start.startsWith(y)) })
    })
  }

  const LABEL_W = 200

  const labelCellBase: React.CSSProperties = {
    width: LABEL_W, minWidth: LABEL_W, maxWidth: LABEL_W,
    position: 'sticky', left: 0, zIndex: 3,
    borderRight: '1px solid var(--color-border-secondary)',
    padding: '5px 12px',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    fontSize: 12,
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 16px', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12 }}>

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--color-background-secondary)', borderRadius: 20, padding: 2, gap: 2 }}>
          {(['weekly','monthly','yearly'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '4px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: 'none', background: viewMode === mode ? '#F5C800' : 'transparent', color: viewMode === mode ? '#1A1A1A' : 'var(--color-text-secondary)' }}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--color-border-tertiary)', flexShrink: 0 }} />

        <MultiSelect label="Locations" options={locationNames} selected={selLocations} onChange={v => { setSelLocations(v); setSelRestaurants([]) }} />
        <MultiSelect label="Restaurants" options={restaurantNames} selected={selRestaurants} onChange={setSelRestaurants} />

        <div style={{ width: 1, height: 20, background: 'var(--color-border-tertiary)', flexShrink: 0 }} />

        {viewMode === 'weekly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>From</span>
            <SingleSelect options={weekOptions} value={fromWeek} onChange={setFromWeek} />
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>→</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>To</span>
            <SingleSelect options={weekOptions} value={toWeek} onChange={setToWeek} />
          </div>
        )}
        {viewMode === 'monthly' && (
          <MultiSelect label="Months" options={monthOptions.map(m => m.label)} selected={selMonths.map(m => monthOptions.find(o => o.key === m)?.label || m)} onChange={labels => setSelMonths(labels.map(l => monthOptions.find(o => o.label === l)?.key || l))} />
        )}
        {viewMode === 'yearly' && (
          <MultiSelect label="Years" options={allYears} selected={selYears} onChange={setSelYears} />
        )}

        {(selLocations.length > 0 || selRestaurants.length > 0) && (
          <button onClick={() => { setSelLocations([]); setSelRestaurants([]) }} style={{ padding: '5px 12px', border: '0.5px solid #ffcccc', borderRadius: 20, background: '#fff5f5', color: '#cc0000', fontSize: 12, cursor: 'pointer' }}>Clear</button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 12, tableLayout: 'fixed', minWidth: `${LABEL_W + columns.length * 100}px` }}>
            <colgroup>
              <col style={{ width: LABEL_W }} />
              {columns.map((col, i) => <col key={i} style={{ width: col.isTotal ? 110 : 95 }} />)}
            </colgroup>
            <thead>
              <tr style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ ...labelCellBase, background: 'var(--color-background-primary)', zIndex: 11, borderBottom: '1px solid var(--color-border-secondary)', fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '6px 12px' }}></th>
                {columns.map((col, i) => (
                  <th key={i} style={{ textAlign: 'right', padding: '6px 10px', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: '1px solid var(--color-border-secondary)', background: col.isTotal ? '#FFF9E0' : 'var(--color-background-primary)', color: col.isTotal ? '#b8860b' : 'var(--color-text-secondary)', borderLeft: col.isTotal ? '1px solid #F5C800' : 'none', borderRight: col.isTotal ? '1px solid #F5C800' : 'none' }}>
                    <div>{col.label}</div>
                    <div style={{ fontWeight: 400, fontSize: 10, color: col.isTotal ? '#b8860b' : 'var(--color-text-secondary)' }}>{col.sub}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => {
                if ('section' in row) {
                  return (
                    <tr key={ri}>
                      <td colSpan={columns.length + 1} style={{ ...labelCellBase, background: 'var(--color-background-secondary)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--color-text-secondary)', zIndex: 4, maxWidth: 'unset', width: 'auto' }}>
                        {row.section}
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr key={ri}>
                    <td style={{ ...labelCellBase, paddingLeft: row.indent ? 24 : 12, fontWeight: row.bold ? 600 : 400, background: row.bold ? 'var(--color-background-secondary)' : 'var(--color-background-primary)', color: row.indent ? 'var(--color-text-secondary)' : 'var(--color-text-primary)', textAlign: 'left' }}>
                      {row.label}
                    </td>
                    {columns.map((col, ci) => {
                      const d = agg(col.rows)
                      const val = (d as any)[row.key as string] as number
                      const formatted = row.format(val)
                      let color: string | undefined
                      if (row.profit) color = val >= 0 ? '#16a34a' : '#dc2626'
                      if (row.profitPct) color = getProfitColor(val)
                      return (
                        <td key={ci} style={{ textAlign: 'right', padding: '5px 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderBottom: '0.5px solid var(--color-border-tertiary)', background: row.bold ? (col.isTotal ? '#FFF9E0' : 'var(--color-background-secondary)') : (col.isTotal ? '#FFFDE8' : 'transparent'), color: color || (col.isTotal ? '#b8860b' : 'var(--color-text-primary)'), fontWeight: row.bold || col.isTotal ? 600 : 400, borderLeft: col.isTotal ? '1px solid #F5C800' : 'none', borderRight: col.isTotal ? '1px solid #F5C800' : 'none' }}>
                          {formatted}
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
    </div>
  )
}
