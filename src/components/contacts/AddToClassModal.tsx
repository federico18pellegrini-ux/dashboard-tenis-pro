'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { addStudentToClass, listAvailableClassesForStudent } from '@/lib/actions/classes'

type Row = {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  club?: { name?: string | null } | null
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

export function AddToClassModal({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string
  studentName: string
  onClose: () => void
}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [classes, setClasses] = useState<Row[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const now = new Date()
        const res = await listAvailableClassesForStudent({
          student_id: studentId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        })
        if (!res.success) throw new Error(res.error ?? 'Error al cargar clases')
        if (cancelled) return
        setClasses((res.classes ?? []) as Row[])
        setSelectedClassId('')
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message ?? 'Error inesperado')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [studentId])

  const formatted = useMemo(() => {
    return (classes ?? []).map((c) => {
      const start = new Date(c.scheduled_at)
      const end = addMinutes(start, c.duration_minutes || 0)
      const date = start.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
      const startTime = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      const endTime = end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      return { ...c, date, startTime, endTime }
    })
  }, [classes])

  async function handleConfirm() {
    if (!selectedClassId) return
    setSaving(true)
    setError('')
    try {
      const res = await addStudentToClass({ class_id: selectedClassId, student_id: studentId })
      if (!res.success) throw new Error(res.error ?? 'No se pudo agregar a la clase')
      router.refresh()
      onClose()
    } catch (e: any) {
      setError(e?.message ?? 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--color-bg-page)]/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 rounded-[2.5rem] w-full max-w-lg shadow-2xl space-y-4 overflow-y-auto max-h-[90vh] custom-scrollbar">
        <div className="flex justify-between items-center gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-[var(--color-text-heading)]  uppercase italic tracking-tighter truncate">Agregar a clase</h2>
            <p className="text-xs font-bold text-[var(--color-text-muted)] truncate">{studentName}</p>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-white shrink-0" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-rose-950/30 border border-rose-900/40 text-rose-200 rounded-2xl p-4 text-xs font-bold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest py-6">Cargando clases…</div>
        ) : formatted.length === 0 ? (
          <div className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest py-6">
            No hay clases disponibles este mes
          </div>
        ) : (
          <div className="space-y-2">
            {formatted.map((c: any) => (
              <label
                key={c.id}
                className={`flex items-center justify-between gap-3 p-4 rounded-2xl border transition-colors cursor-pointer ${
                  selectedClassId === c.id ? 'border-[#bdfd2c] bg-[var(--color-bg-page)]/30' : 'border-[var(--color-border)] bg-[var(--color-bg-page)]/10 hover:bg-[var(--color-bg-page)]/20'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-black text-[var(--color-text-heading)] uppercase tracking-tight truncate">
                    {c.date} · {c.startTime}–{c.endTime}
                  </div>
                  <div className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest truncate">
                    {c.club?.name ?? 'Sede'} · {String(c.status ?? 'scheduled').toUpperCase()}
                  </div>
                </div>
                <input
                  type="radio"
                  name="class"
                  className="accent-[#bdfd2c]"
                  checked={selectedClassId === c.id}
                  onChange={() => setSelectedClassId(c.id)}
                />
              </label>
            ))}
          </div>
        )}

        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-[var(--color-border)] text-[var(--color-text-body)] px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[var(--color-bg-page)]/40 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!selectedClassId || saving}
            className="flex-1 bg-[var(--color-accent-secondary)] hover:bg-green-800  dark:hover:bg-[#a5e620] text-white dark:text-slate-950 px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'Agregando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

