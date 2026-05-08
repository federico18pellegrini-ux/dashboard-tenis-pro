'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AddToTournamentModal({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string
  studentName: string
  onClose: () => void
}) {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [selectedTournament, setSelectedTournament] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    supabase
      .from('tournaments')
      .select('id, name, status')
      .neq('status', 'Finalizado')
      .order('start_date', { ascending: false })
      .then(({ data }) => setTournaments(data ?? []))
  }, [])

  useEffect(() => {
    if (!selectedTournament) {
      setCategories([])
      return
    }
    supabase
      .from('tournament_categories')
      .select('id, name, club:clubs(name)')
      .eq('tournament_id', selectedTournament)
      .then(({ data }) => {
        setCategories(data ?? [])
        setSelectedCategory('')
      })
  }, [selectedTournament])

  const handleSubmit = async () => {
    if (!selectedTournament || !selectedCategory) {
      setError('Seleccioná torneo y categoría')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.from('tournament_students').insert({
      tournament_id: selectedTournament,
      student_id: studentId,
      category_id: selectedCategory,
      payment_status: 'pending',
    })
    if (err) { 
      setError(err.code === '23505' ? 'Este alumno ya está anotado en esta categoría' : err.message)
      setLoading(false)
      return 
    }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl p-6 w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[var(--color-text-heading)] uppercase tracking-widest">🏆 Agregar a torneo</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]">
            ✕
          </button>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest font-bold">{studentName}</p>

        <div className="space-y-3">
          <select
            value={selectedTournament}
            onChange={(e) => {
              setSelectedTournament(e.target.value)
              setSelectedCategory('')
            }}
            className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs font-bold text-[var(--color-text-body)] outline-none"
          >
            <option value="">Seleccionar torneo...</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs font-bold text-[var(--color-text-body)] outline-none"
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.club?.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-[var(--color-bg-card-inner)] text-[var(--color-text-muted)] py-3 rounded-2xl text-xs font-black uppercase tracking-widest"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[var(--color-accent)] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
          >
            {loading ? '...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}

