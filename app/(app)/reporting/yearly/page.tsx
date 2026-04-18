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
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, cursor: 'pointer', minWidth: 160 }}>
        <span style={{ flex: 1, textAlign: 'left' }}>{allSelected ? `All ${label}` : `${selected.length} selected`}</span>
        {!allSelected && <span onClick={e => { e.stopPropagation(); onChange([]) }} style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>✕</span>}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4, minWidth: 200, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
          <div onClick={() => onChange([])} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', background: allSelected ? '#FFF9E0' : 'transparent', color: allSelected ? '#b8860b' : 'var(--color-text-primary)', fontWeight: allSelected ? 500 : 400 }}>All {label}</div>
          {options.map(opt => (
            <div key={opt} onClick={() => toggle(opt)} style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, background: selected.includes(opt) ? '#FFF9E0' : 'transparent', color: selected.includes(opt) ? '#b8860b' : 'var(--color-text-primary)' }}>
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

export default function YearlyReportPage() {
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
  const restaurantNames = restaurants.filter(r => selLocations.length === 0 || selLocations.includes(r.report_locations?.name)).map(r => r.name)

  const filteredData = allData.filter(d => {
    const loc = d.report_restaurants?.report_locations?.name
    const rest = d.report_restaurants?.name
    return (selLocations.length === 0 || selLocations.includes(loc)) && (selRestaurants.length === 0 || selRestaurants.includes(rest))
  })

  const MONTH_NAMES: Record<string, string> = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' }

  // Group by year then month
  const yearMonthMap: Record<string, Record<string, any[]>> = {}
  filteredData.forEach(d => {
    const date = new Date(d.week_start)
    const year = String(date.getFullYear())
    const month = String(date.getMonth()+1).padStart(2,'0')
    if (!yearMonthMap[year]) yearMonthMap[year] = {}
    if (!yearMonthMap[year][month]) yearMonthMap[year][month] = []
    yearMonthMap[year][month].push(d)
  })

  const years = Object.keys(yearMonthMap).sort()

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', marginRight: 8 }}>Yearly Report</h2>
        <MultiSelect label="Locations" options={locationNames} selected={selLocations} onChange={v => { setSelLocations(v); setSelRestaurants([]) }} />
        <MultiSelect label="Restaurants" options={restaurantNames} selected={selRestaurants} onChange={setSelRestaurants} />
        {(selLocations.length > 0 || selRestaurants.length > 0) && (
          <button onClick={() => { setSelLocations([]); setSelRestaurants([]) }} style={{ padding: '6px 12px', border: '0.5px solid #ffcccc', borderRadius: 'var(--border-radius-md)', background: '#fff0f0', color: '#cc0000', fontSize: 12, cursor: 'pointer' }}>Clear all</button>
        )}
      </div>

      {years.map(year => {
        const months = Object.keys(yearMonthMap[year]).sort()
        const yearRows = months.flatMap(m => yearMonthMap[year][m])
        const yearData = agg(yearRows)

        type Col = { type: 'month', month: string } | { type: 'year' }
        const columns: Col[] = [
          ...months.map(m => ({ type: 'month' as const, month: m })),
          { type: 'year' as const }
        ]

        const getColData = (col: Col) => {
          if (col.type === 'year') return yearData
          return agg(yearMonthMap[year][col.month] || [])
        }

        return (
          <div key={year} style={{ marginBottom: 32 }}>
            <div style={{ padding: '8px 12px', background: '#FFF9E0', borderRadius: 'var(--border-radius-md)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: '#b8860b', fontSize: 14 }}>{year}</span>
              <span style={{ fontSize: 12, color: '#b8860b' }}>
                Revenue: {fmt(yearData.grossRev)} · Profit: {fmt(yearData.netProfit)} ({fmtPct(yearData.profitPct)})
              </span>
            </div>

            <div style={{ overflowX: 'auto', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-lg)' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 12px', fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-secondary)', minWidth: 180, position: 'sticky', left: 0, zIndex: 2 }}></th>
                    {columns.map((col, i) => {
                      const isY = col.type === 'year'
                      const label = isY ? year : MONTH_NAMES[col.month] || col.month
                      return (
                        <th key={i} style={{ textAlign: 'right', padding: '4px 8px', fontSize: 11, fontWeight: 500, color: isY ? '#b8860b' : 'var(--color-text-secondary)', background: isY ? '#FFF9E0' : 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-secondary)', whiteSpace: 'nowrap', minWidth: 90 }}>
                          {label}
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
                          const isY = col.type === 'year'
                          const val = (d as any)[row.key as string] as number
                          const formatted = row.format(val)
                          let color: string | undefined
                          if (row.profit) color = val >= 0 ? '#16a34a' : '#dc2626'
                          if (row.profitPct) color = getProfitColor(val)
                          return (
                            <td key={ci} style={{ textAlign: 'right', padding: '3px 8px', fontSize: 12, background: row.bold ? (isY ? '#FFFDE8' : 'var(--color-background-secondary)') : (isY ? '#FFFDE8' : 'transparent'), color: color || (isY ? '#b8860b' : 'var(--color-text-primary)'), fontWeight: row.bold || isY ? 600 : 400, borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>
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
      })}
    </div>
  )
}
