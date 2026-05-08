'use client'

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { addStudentToClass } from '@/lib/actions/classes'

export function AddStudentToClassModal({
  classId,
  existingStudentIds,
  allStudents,
  onClose,
}: {
  classId: string
  existingStudentIds: string[]
  allStudents: { id: string; full_name: string }[]
  onClose: () => void
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredStudents = useMemo(() => {
    const existing = new Set(existingStudentIds)
    return allStudents
      .filter((s) => !existing.has(s.id))
      .slice()
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [allStudents, existingStudentIds])

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (selectedIds.size === 0) {
      setError('Seleccioná al menos un alumno')
      return
    }

    setIsSubmitting(true)
    try {
      const ids = Array.from(selectedIds)
      const results = await Promise.all(
        ids.map((student_id) => addStudentToClass({ class_id: classId, student_id })),
      )

      const firstErr = results.find((r) => !r.success)
      if (firstErr && !firstErr.success) {
        setError(firstErr.error ?? 'Error al agregar alumno')
        setIsSubmitting(false)
        return
      }

      router.refresh()
      onClose()
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 bg-[var(--color-bg-page)]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] border border-black/10  p-8 rounded-[2rem] w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-[var(--color-text-body)] text-[var(--color-text-heading)] uppercase italic tracking-tighter">
            Agregar alumno a la clase
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] dark:hover:text-white transition-colors" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar bg-gray-200 bg-[var(--color-bg-page)] border border-black/10 dark:border-slate-800 rounded-xl p-3 space-y-2">
            {filteredStudents.length === 0 ? (
              <div className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold uppercase tracking-widest">
                No hay alumnos disponibles para agregar
              </div>
            ) : (
              filteredStudents.map((s) => (
                <label key={s.id} className="flex items-center gap-3 text-sm text-gray-800 text-[var(--color-text-body)] font-bold">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => toggle(s.id)}
                    className="h-4 w-4 accent-slate-200"
                  />
                  <span className="truncate">{s.full_name}</span>
                </label>
              ))
            )}
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
              className="flex-1 bg-gray-300 bg-[var(--color-bg-card-inner)] text-gray-700 dark:text-slate-400 font-bold py-3 rounded-2xl text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || filteredStudents.length === 0}
              className="flex-1 bg-white bg-[var(--color-bg-page)] border border-black/10 dark:border-slate-800 text-[var(--color-text-body)] text-[var(--color-text-heading)] font-black py-3 rounded-2xl text-sm uppercase tracking-widest hover:border-gray-400 dark:hover:border-slate-700 disabled:opacity-50"
            >
              {isSubmitting ? 'AGREGANDO...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

