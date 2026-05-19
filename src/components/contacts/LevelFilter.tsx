'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { STUDENT_LEVELS } from '@/lib/levels'

type Props = {
  currentLevel: string | undefined
}

export function LevelFilter({ currentLevel }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    const newLevel = e.target.value
    if (newLevel) {
      params.set('level', newLevel)
    } else {
      params.delete('level')
    }
    // Asegurar que status quede en student
    params.set('status', 'student')
    router.push(`/dashboard/contactos?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label
        htmlFor="level-filter"
        className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]"
      >
        Filtrar por nivel
      </label>
      <select
        id="level-filter"
        value={currentLevel ?? ''}
        onChange={handleChange}
        className="bg-[var(--color-bg-card-inner)] border border-black/10 rounded-xl px-4 py-2 text-xs font-bold text-[var(--color-text-body)] outline-none focus:border-[var(--color-accent)] transition-all"
      >
        <option value="">Todos los niveles</option>
        {STUDENT_LEVELS.map((lvl) => (
          <option key={lvl} value={lvl}>
            {lvl}
          </option>
        ))}
      </select>
    </div>
  )
}
