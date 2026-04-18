'use client'
import { useFilters } from './FilterContext'

export default function FilterBar() {
  const { filters, setFilters, locations, restaurants, availableMonths } = useFilters()

  const toggleLocation = (loc: string) => {
    const current = filters.locations
    setFilters({ locations: current.includes(loc) ? current.filter(l => l !== loc) : [...current, loc] })
  }

  const toggleRestaurant = (rest: string) => {
    const current = filters.restaurants
    setFilters({ restaurants: current.includes(rest) ? current.filter(r => r !== rest) : [...current, rest] })
  }

  const years = [...new Set(availableMonths.map(m => m.key.split('-')[0]))]
  const quarters = availableMonths.reduce((acc, m) => {
    const [year, month] = m.key.split('-')
    const q = Math.ceil(parseInt(month) / 3)
    const key = `${year}-Q${q}`
    if (!acc.includes(key)) acc.push(key)
    return acc
  }, [] as string[])

  return (
    <div className="bg-white px-6 py-3 flex flex-wrap gap-3 items-center" style={{ borderBottom: '1px solid #e5e5e5' }}>

      {/* View Mode */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#f5f5f5' }}>
        {(['weekly', 'monthly', 'yearly'] as const).map(mode => (
          <button key={mode} onClick={() => setFilters({ viewMode: mode })}
            className="px-3 py-1 rounded-lg text-xs font-medium capitalize transition"
            style={{ backgroundColor: filters.viewMode === mode ? '#F5C800' : 'transparent', color: filters.viewMode === mode ? '#1A1A1A' : '#888' }}>
            {mode}
          </button>
        ))}
      </div>

      {/* Period */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilters({ period: 'all' })}
          className="px-3 py-1 rounded-full text-xs font-medium transition"
          style={{ backgroundColor: filters.period === 'all' ? '#F5C800' : '#f5f5f5', color: filters.period === 'all' ? '#1A1A1A' : '#666', border: '1px solid #e5e5e5' }}>
          All Time
        </button>
        {years.map(y => (
          <button key={y} onClick={() => setFilters({ period: y })}
            className="px-3 py-1 rounded-full text-xs font-medium transition"
            style={{ backgroundColor: filters.period === y ? '#F5C800' : '#f5f5f5', color: filters.period === y ? '#1A1A1A' : '#666', border: '1px solid #e5e5e5' }}>
            {y}
          </button>
        ))}
        {quarters.map(q => (
          <button key={q} onClick={() => setFilters({ period: q })}
            className="px-3 py-1 rounded-full text-xs font-medium transition"
            style={{ backgroundColor: filters.period === q ? '#F5C800' : '#f5f5f5', color: filters.period === q ? '#1A1A1A' : '#666', border: '1px solid #e5e5e5' }}>
            {q.replace('-', ' ')}
          </button>
        ))}
        {availableMonths.map(m => (
          <button key={m.key} onClick={() => setFilters({ period: m.key })}
            className="px-3 py-1 rounded-full text-xs font-medium transition"
            style={{ backgroundColor: filters.period === m.key ? '#F5C800' : '#f5f5f5', color: filters.period === m.key ? '#1A1A1A' : '#666', border: '1px solid #e5e5e5' }}>
            {m.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Locations — multiple */}
      <div className="flex gap-1.5 flex-wrap">
        {locations.map(loc => (
          <button key={loc} onClick={() => toggleLocation(loc)}
            className="px-3 py-1 rounded-full text-xs font-medium transition"
            style={{ backgroundColor: filters.locations.includes(loc) ? '#1A1A1A' : '#f5f5f5', color: filters.locations.includes(loc) ? '#fff' : '#666', border: '1px solid #e5e5e5' }}>
            {filters.locations.includes(loc) ? '✓ ' : ''}{loc.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Restaurants — multiple */}
      <div className="flex gap-1.5 flex-wrap">
        {['Angies', 'Golden'].map(brand => {
          const isActive = filters.restaurants.some(r => r.toLowerCase().includes(brand.toLowerCase()))
          return (
            <button key={brand}
              onClick={() => {
                const brandRests = restaurants.filter(r => r.name.includes(brand)).map(r => r.name)
                const allSelected = brandRests.every(r => filters.restaurants.includes(r))
                if (allSelected) {
                  setFilters({ restaurants: filters.restaurants.filter(r => !brandRests.includes(r)) })
                } else {
                  setFilters({ restaurants: [...new Set([...filters.restaurants, ...brandRests])] })
                }
              }}
              className="px-3 py-1 rounded-full text-xs font-medium transition"
              style={{ backgroundColor: isActive ? '#F5C800' : '#f5f5f5', color: isActive ? '#1A1A1A' : '#666', border: '1px solid #e5e5e5' }}>
              {isActive ? '✓ ' : ''}{brand}
            </button>
          )
        })}
      </div>

      {/* Clear */}
      {(filters.locations.length > 0 || filters.restaurants.length > 0 || filters.period !== 'all') && (
        <button onClick={() => setFilters({ locations: [], restaurants: [], period: 'all' })}
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#fff0f0', color: '#cc0000', border: '1px solid #ffcccc' }}>
          Clear all ✕
        </button>
      )}
    </div>
  )
}
