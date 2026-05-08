'use client'

export type AvailabilitySlot = {
  day_of_week: number
  start_time: string // HH:MM
  active: boolean
}

export type AvailabilityClub = {
  id: string
  name: string
}

export type AvailabilityClubCells = Map<string, boolean> // key: `${day_of_week}|${start_time}`

const DAYS: Array<{ label: string; value: number }> = [
  { label: 'LUN', value: 1 },
  { label: 'MAR', value: 2 },
  { label: 'MIE', value: 3 },
  { label: 'JUE', value: 4 },
  { label: 'VIE', value: 5 },
  { label: 'SAB', value: 6 },
  { label: 'DOM', value: 0 },
]

const HOURS: Array<{ label: string; start_time: string }> = Array.from({ length: 15 }, (_, i) => {
  const hour = 8 + i
  const hh = hour.toString().padStart(2, '0')
  return { label: `${hour}h`, start_time: `${hh}:00` }
})

function keyFor(day_of_week: number, start_time: string) {
  return `${day_of_week}|${start_time}`
}

export function AvailabilityGrid({
  club,
  cells,
  changedCount,
  onToggle,
}: {
  club: AvailabilityClub
  cells: AvailabilityClubCells
  changedCount: number
  onToggle: (day_of_week: number, start_time: string) => void
}) {
  return (
    <section className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between gap-4">
        <h2 className="text-xs font-black text-white uppercase tracking-[0.15em] italic">{club.name}</h2>
        {changedCount > 0 && (
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
            * {changedCount} cambios sin guardar
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/40 border-b border-slate-800">
              <th className="px-6 py-4 text-left w-[72px]">Hora</th>
              {DAYS.map((d) => (
                <th key={d.value} className="px-3 py-4 text-center min-w-[70px]">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {HOURS.map((h) => (
              <tr key={h.start_time} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {h.label}
                </td>
                {DAYS.map((d) => {
                  const k = keyFor(d.value, h.start_time)
                  const active = cells.get(k) ?? false
                  return (
                    <td key={d.value} className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggle(d.value, h.start_time)}
                        className={[
                          'w-10 h-10 rounded-xl border transition-all shadow-inner',
                          active
                            ? 'bg-[var(--color-accent-secondary)] border-green-700 dark:bg-[#bdfd2c] dark:border-[#bdfd2c]/40 text-white dark:text-slate-950'
                            : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600',
                        ].join(' ')}
                        aria-pressed={active}
                        aria-label={`${club.name} ${d.label} ${h.label}`}
                      >
                        <span className="text-sm font-black">{active ? '✓' : ''}</span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

