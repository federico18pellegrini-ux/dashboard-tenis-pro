'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClass } from '@/lib/actions/classes'

type Club = { id: string; name: string }
type Student = { id: string; full_name: string }

export function CreateClassLauncher({ clubs, students }: { clubs: Club[]; students: Student[] }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-[var(--color-accent-secondary)] hover:bg-green-800  dark:hover:bg-[#a5e620] text-white dark:text-slate-950 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        Nueva clase
      </button>
    )
  }

  return <CreateClassModal clubs={clubs} students={students} onClose={() => setOpen(false)} />
}

export function CreateClassModal({
  clubs,
  students,
  onClose,
}: {
  clubs: Club[]
  students: Student[]
  onClose: () => void
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [clubId, setClubId] = useState<string>(clubs[0]?.id ?? '')
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('11:00')
  const [pricePesos, setPricePesos] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const timeOptions = useMemo(() => {
    const out: string[] = []
    for (let h = 7; h <= 22; h++) {
      out.push(`${String(h).padStart(2, '0')}:00`)
      if (h < 22) out.push(`${String(h).padStart(2, '0')}:30`)
    }
    return out
  }, [])

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [students])

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!pricePesos || parseFloat(pricePesos) <= 0) {
      setError('Ingresá un precio por alumno mayor a $0')
      setIsSubmitting(false)
      return
    }

    const priceCents = Math.round((parseFloat(pricePesos || '0') || 0) * 100)

    const result = await createClass({
      club_id: clubId,
      scheduled_date: date,
      start_time: startTime,
      end_time: endTime,
      student_ids: Array.from(selectedIds),
      price_cents: priceCents,
    })

    if (!result.success) {
      const msg =
        result?.error
          ? (result.error.startsWith('[') ? 'Revisá los datos ingresados' : result.error)
          : 'Error al crear la clase.'
      setError(msg)
      setIsSubmitting(false)
      return
    }

    router.refresh()
    onClose()
    setIsSubmitting(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 bg-[var(--color-bg-page)]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] border border-black/10  p-8 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-[var(--color-text-heading)]  uppercase italic tracking-tighter">Nueva clase</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] dark:hover:text-white transition-colors" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Sede</label>
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                required
                className="w-full bg-white bg-[var(--color-bg-page)] border border-black/10 dark:border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-body)] dark:text-white font-bold mt-1 outline-none"
              >
                <option value="">Seleccionar...</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                required
                className="w-full bg-white bg-[var(--color-bg-page)] border border-black/10 dark:border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-body)] dark:text-white font-bold mt-1 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Hora inicio</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-white bg-[var(--color-bg-page)] border border-black/10 dark:border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-body)] dark:text-white font-bold mt-1 outline-none"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t} hs
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Hora fin</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-white bg-[var(--color-bg-page)] border border-black/10 dark:border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-body)] dark:text-white font-bold mt-1 outline-none"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t} hs
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Alumnos</label>
            <div className="mt-1 max-h-[240px] overflow-y-auto custom-scrollbar bg-gray-200 bg-[var(--color-bg-page)] border border-black/10 dark:border-[var(--color-border)] rounded-xl p-3 space-y-2">
              {sortedStudents.map((s) => (
                <label key={s.id} className="flex items-center gap-3 text-sm text-[var(--color-text-body)] text-[var(--color-text-body)] font-bold">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggleStudent(s.id)}
                    className="h-4 w-4 accent-green-500"
                  />
                  <span className="truncate">{s.full_name}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold uppercase tracking-widest mt-2">
              Seleccionados: {selectedIds.size}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Precio por alumno ($)</label>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="ej: 15000"
              value={pricePesos}
              onChange={(e) => setPricePesos(e.target.value)}
              required
              className="w-full bg-white bg-[var(--color-bg-page)] border border-black/10 dark:border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-body)] dark:text-white font-bold mt-1 outline-none"
            />
          </div>

          {error && (
            <div className="px-5 py-4 rounded-2xl border shadow-2xl text-xs font-black uppercase tracking-widest bg-red-50 dark:bg-rose-950/30 border-red-200 dark:border-rose-900/40 text-red-600 dark:text-red-400" role="status">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 bg-[var(--color-bg-card-inner)] text-gray-700 dark:text-[var(--color-text-muted)] font-bold py-3 rounded-2xl text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[var(--color-accent)] text-white font-black py-3 rounded-2xl text-sm shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'CREANDO...' : 'Crear clase'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

