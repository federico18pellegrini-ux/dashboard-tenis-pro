'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type Club = { id: string; name: string }

function toDateInputValue(d: Date) {
  return d.toISOString().split('T')[0]
}

export function CreateTournamentModal({ clubs: _clubs }: { clubs: Club[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState(() => toDateInputValue(new Date()))
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()))
  const [notes, setNotes] = useState('')

  useEffect(() => setMounted(true), [])
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error: insertError } = await supabase
        .from('tournaments')
        .insert({
          name,
          start_date: startDate,
          end_date: endDate,
          notes: notes || null,
          status: 'upcoming',
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      const id = data?.id
      if (!id) throw new Error('No se pudo crear el torneo.')

      setOpen(false)
      router.push(`/dashboard/torneos/${id}`)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Error al crear el torneo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const overlay = (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--color-bg-page)]/90 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6 border-b border-[var(--color-border)] pb-4">
          <h2 className="text-xl font-black text-[var(--color-text-heading)] uppercase italic tracking-tighter">
            Nuevo torneo
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] transition-colors"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1.5 ml-1">
                  Nombre
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej: Torneo Otoño 2026"
                  className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none focus:border-[var(--color-accent)] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1.5 ml-1">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    required
                    className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none focus:border-[var(--color-accent)] transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1.5 ml-1">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    required
                    className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none focus:border-[var(--color-accent)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1.5 ml-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none focus:border-[var(--color-accent)] transition-all resize-none"
                  placeholder="Formato, reglas, premios…"
                />
              </div>
            </div>

            {error && (
              <div className="px-5 py-4 rounded-2xl border shadow-2xl text-xs font-black uppercase tracking-widest bg-[var(--color-bg-card-inner)] border-[var(--color-accent)]/30 text-[var(--color-accent)]" role="status">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 bg-[var(--color-bg-card-inner)] text-[var(--color-text-muted)] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-[var(--color-text-heading)] transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[var(--color-accent-secondary)] text-[var(--color-text-heading)] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'CREANDO...' : 'Crear torneo'}
              </button>
            </div>
          </form>
        </div>
      </div>
  )

  if (!mounted) return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-[var(--color-accent-secondary)] text-[var(--color-text-heading)] px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        Nuevo torneo
      </button>
    )
  }

  return createPortal(overlay, document.body)
}

