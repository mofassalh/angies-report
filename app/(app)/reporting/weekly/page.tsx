'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ChevronDown, X } from 'lucide-react'

const CHANNELS = ['Store', 'Uber Eats', 'DoorDash']

function MultiSelect({ label, options, selected, onChange }: {
  label: string, options: string[], selected: string[], onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v])
  }
  const allSelected = selected.length === 0

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, cursor: 'pointer', minWidth: 160 }}>
        <span style={{ flex: 1, textAlign: 'left' }}>
          {allSelected ? `All ${label}` : `${selected.length} selected`}
        </span>
        {!allSelected && (
          <span onClick={e => { e.stopPropagation(); onChange([]) }}
            style={{ color: 'var(--color-text-secondary)', fontSize: 11, lineHeight: 1 }}>✕</span>
        )}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4, minWidth: 200, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div onClick={() => onChange([])}
            style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', background: allSelected ? '#FFF9E0' : 'transparent', color: allSelected ? '#b8860b' : 'var(--color-text-primary)', fontWeight: allSelected ? 500 : 400 }}>
            All {label}
          </div>
          {options.map(opt => (
            <div key={opt} onClick={() => toggle(opt)}
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: selected.includes(opt) ? '#FFF9E0' : 'transparent', color: selected.includes(opt) ? '#b8860b' : 'var(--color-text-primary)' }}>
              <div style={{ width: 14, height: 14, border: `1.5px solid ${selected.includes(opt) ? '#F5C800' : 'var(--color-border-secondary)'}`, borderRadius: 3, background: selected.includes(opt) ? '#F5C800' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selected.includes(opt) && <span style={{ fontSize: 10, color: '#1A1A1A', fontWeight: 700 }}>✓</span>}
              </div>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WeeklyReportPage() {
  const [allData, setAllData] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selLocations, setSelLocations] = useState<string[]>([])
  const [selRestaurants, setSelRestaurants] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: rests } = await supabase.from('report_restaurants').select('*, report_locations(name)').order('name')
      setRestaurants(rests || [])
      const { data: weekly } = await supabase.from('report_weekly_data').select('*, report_restaurants(name, brand, report_locations(name))').order('week_start')
      setAllData(weekly || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  const locationNames = [...new Set(restaurants.map((r: any) => r.report_locations?.name).filter(Boolean))] as string[]
  const restaurantNames = restaurants
    .filter(r => selLocations.length === 0 || selLocations.includes(r.report_locations?.name))
    .map(r => r.name)

  const filteredData = allData.filter(d => {
    const loc = d.report_restaurants?.report_locations?.name
    const rest = d.report_restaurants?.name
    const locMatch = selLocations.length === 0 || selLocations.includes(loc)
    const restMatch = selRestaurants.length === 0 || selRestaurants.includes(rest)
    return locMatch && restMatch
  })

  // Get unique weeks sorted
  const weekDates = [...new Set(filteredData.map(d => d.week_start))].sort()

  // Get months
  const monthMap: Record<string, string[]> = {}
  weekDates.forEach(w => {
    const date = new Date(w)
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
    if (!monthMap[key]) monthMap[key] = []
    monthMap[key].push(w)
  })

  // Aggregate data for a given set of weeks
  const agg = (weeks: string[]) => {
    const rows = filteredData.filter(d => weeks.includes(d.week_start))
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

  const monthNames: Record<string, string> = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
  }

  // Build columns: weeks interleaved with month totals
  type Col = { type: 'week', date: string } | { type: 'month', key: string, weeks: string[] }
  const columns: Col[] = []
  Object.entries(monthMap).forEach(([monthKey, weeks]) => {
    weeks.forEach(w => columns.push({ type: 'week', date: w }))
    columns.push({ type: 'month', key: monthKey, weeks })
  })

  const getColData = (col: Col) => {
    if (col.type === 'week') return agg([col.date])
    return agg(col.weeks)
  }

  const getColLabel = (col: Col) => {
    if (col.type === 'month') {
      const [year, month] = col.key.split('-')
      return { top: monthNames[month] || month, bottom: year }
    }
    const date = new Date(col.date)
    const weekNum = weekDates.indexOf(col.date) + 1
    return {
      top: `Week ${weekNum}`,
      bottom: date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
    }
  }

  const isMonth = (col: Col) => col.type === 'month'

  const rows = [
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
    { key: 'grossProfit', label: 'Gross Profit', format: fmt, profit: true },
    { key: 'netProfit', label: 'Net Profit', format: fmt, profit: true },
    { key: 'profitPct', label: 'Profit %', format: fmtPct, profitPct: true },
    { section: 'Transactions' },
    { key: 'storeTx', label: 'Store', format: fmtN, indent: true },
    { key: 'uberTx', label: 'Uber Eats', format: fmtN, indent: true },
    { key: 'ddTx', label: 'DoorDash', format: fmtN, indent: true },
  ]

  const thStyle = (isM: boolean): React.CSSProperties => ({
    textAlign: 'right', padding: '4px 8px', fontSize: 11, fontWeight: 500,
    color: isM ? '#b8860b' : 'var(--color-text-secondary)',
    background: isM ? '#FFF9E0' : 'var(--color-background-primary)',
    borderBottom: '1px solid var(--color-border-secondary)',
    whiteSpace: 'nowrap', minWidth: 80,
  })

  const tdStyle = (isM: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
    textAlign: 'right', padding: '3px 8px', fontSize: 12,
    background: isM ? '#FFFDE8' : 'transparent',
    fontWeight: isM ? 600 : 400,
    color: isM ? '#b8860b' : 'var(--color-text-primary)',
    borderBottom: '0.5px solid var(--color-border-tertiary)',
    whiteSpace: 'nowrap',
    ...extra,
  })

  const getProfitColor = (val: number) => val >= 20 ? '#16a34a' : val >= 10 ? '#d97706' : '#dc2626'

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', marginRight: 8 }}>Weekly Report</h2>
        <MultiSelect label="Locations" options={locationNames} selected={selLocations} onChange={v => { setSelLocations(v); setSelRestaurants([]) }} />
        <MultiSelect label="Restaurants" options={restaurantNames} selected={selRestaurants} onChange={setSelRestaurants} />
        {(selLocations.length > 0 || selRestaurants.length > 0) && (
          <button onClick={() => { setSelLocations([]); setSelRestaurants([]) }}
            style={{ padding: '6px 12px', border: '0.5px solid #ffcccc', borderRadius: 'var(--border-radius-md)', background: '#fff0f0', color: '#cc0000', fontSize: 12, cursor: 'pointer' }}>
            Clear all
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-lg)' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 12px', fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-secondary)', minWidth: 180, position: 'sticky', left: 0, zIndex: 2 }}></th>
              {columns.map((col, i) => {
                const lbl = getColLabel(col)
                const isM = isMonth(col)
                return (
                  <th key={i} style={thStyle(isM)}>
                    <div>{lbl.top}</div>
                    <div style={{ fontWeight: 400, color: isM ? '#b8860b' : 'var(--color-text-secondary)', fontSize: 10 }}>{lbl.bottom}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              if ('section' in row) {
                return (
                  <tr key={ri}>
                    <td colSpan={columns.length + 1} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', background: 'var(--color-background-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', position: 'sticky', left: 0 }}>
                      {row.section}
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={ri}>
                  <td style={{ padding: '3px 12px', paddingLeft: row.indent ? 24 : 12, fontSize: 12, fontWeight: row.bold ? 600 : 400, color: 'var(--color-text-primary)', background: row.bold ? 'var(--color-background-secondary)' : 'var(--color-background-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)', position: 'sticky', left: 0, zIndex: 1, whiteSpace: 'nowrap' }}>
                    {row.label}
                  </td>
                  {columns.map((col, ci) => {
                    const d = getColData(col)
                    const isM = isMonth(col)
                    const val = (d as any)[row.key as string] as number
                    const formatted = row.format(val)

                    let color: string | undefined
                    if (row.profit) color = val >= 0 ? '#16a34a' : '#dc2626'
                    if (row.profitPct) color = getProfitColor(val)

                    return (
                      <td key={ci} style={tdStyle(isM, {
                        background: row.bold ? (isM ? '#FFFDE8' : 'var(--color-background-secondary)') : (isM ? '#FFFDE8' : 'transparent'),
                        color: color || (isM ? '#b8860b' : 'var(--color-text-primary)'),
                        fontWeight: row.bold || isM ? 600 : 400,
                      })}>
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
  )
}
