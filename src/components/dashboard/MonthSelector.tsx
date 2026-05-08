'use client'

import { useRouter } from 'next/navigation'

export function MonthSelector({
  currentMonth,
  currentYear,
  /** Ruta absoluta (ej. `/dashboard/caja`) para evitar navegación incorrecta al usar solo query string. */
  pathname,
}: {
  currentMonth: number
  currentYear: number
  pathname?: string
}) {
  const router = useRouter()

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]

  const handleNavigate = (direction: number) => {
    let newMonth = currentMonth + direction
    let newYear = currentYear

    if (newMonth > 12) {
      newMonth = 1
      newYear++
    } else if (newMonth < 1) {
      newMonth = 12
      newYear--
    }

    const qs = `month=${newMonth}&year=${newYear}`
    if (pathname) {
      router.push(`${pathname}?${qs}`)
    } else {
      router.push(`?${qs}`)
    }
  }

  return (
    <div className="flex items-center gap-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] p-1.5 rounded-2xl shadow-xl">
      <button 
        onClick={() => handleNavigate(-1)}
        className="p-2 hover:bg-[var(--color-bg-card-inner)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        title="Mes anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      
      <div className="px-4 py-1 flex flex-col items-center min-w-[140px]">
        <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] leading-none mb-1">Visualizando</span>
        <span className="text-sm font-black uppercase italic tracking-tighter text-[var(--color-text-heading)] ">
          {months[currentMonth - 1]} {currentYear}
        </span>
      </div>

      <button 
        onClick={() => handleNavigate(1)}
        className="p-2 hover:bg-[var(--color-bg-card-inner)] rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        title="Mes siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>
  )
}