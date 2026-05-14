'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTournament } from '@/app/dashboard/torneos/actions'

function formatPesos(amountCents: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format((amountCents || 0) / 100)
}

type Props = {
  tournamentId: string
  tournamentName: string
  impact: {
    categoriesCount: number
    studentsCount: number
    paymentsCount: number
    paymentsTotalCents: number
  }
}

export function DeleteTournamentButton({ tournamentId, tournamentName, impact }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const canDelete = confirmText === 'ELIMINAR'

  async function handleDelete() {
    if (!canDelete) return
    setLoading(true)
    setError(null)
    const result = await deleteTournament(tournamentId, confirmText)
    if (result.success) {
      setIsOpen(false)
      setConfirmText('')
      router.refresh()
    } else {
      setError(result.error ?? 'Error al eliminar')
    }
    setLoading(false)
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => { setError(null); setConfirmText(''); setIsOpen(true) }}
        className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-rose-500/30 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-300 hover:border-rose-500 hover:bg-rose-500/10 transition-colors shadow-xl whitespace-nowrap"
        aria-label={`Eliminar torneo ${tournamentName}`}
      >
        Eliminar
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-page)]/90 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-8 rounded-[2.5rem] w-full max-w-md space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black tracking-tighter text-[var(--color-text-heading)] uppercase italic">
          Eliminar torneo
        </h2>

        <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-4 space-y-3">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-200 leading-snug">
            Esto va a eliminar permanentemente:
          </p>
          <ul className="text-xs font-bold text-[var(--color-text-body)] space-y-1 list-disc list-inside">
            <li>Torneo <span className="font-black">{tournamentName}</span></li>
            <li>{impact.categoriesCount} {impact.categoriesCount === 1 ? 'categoría' : 'categorías'}</li>
            <li>{impact.studentsCount} {impact.studentsCount === 1 ? 'inscripción' : 'inscripciones'}</li>
            <li>
              {impact.paymentsCount} {impact.paymentsCount === 1 ? 'pago' : 'pagos'}
              {impact.paymentsCount > 0 && (
                <> por <span className="font-black">{formatPesos(impact.paymentsTotalCents)}</span></>
              )}
            </li>
          </ul>
          <p className="text-[11px] font-bold text-rose-700 dark:text-rose-200 leading-snug pt-1">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div>
          <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">
            Escribí ELIMINAR para confirmar
          </label>
          <input
            type="text"
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-4 text-sm font-bold text-[var(--color-text-heading)] outline-none focus:border-rose-500 transition-all mt-1"
            placeholder="ELIMINAR"
          />
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => { setIsOpen(false); setConfirmText(''); setError(null) }}
            className="flex-1 bg-[var(--color-bg-card-inner)] text-[var(--color-text-muted)] font-bold py-4 rounded-2xl text-sm"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || loading}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl text-sm shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? 'ELIMINANDO...' : 'ELIMINAR DEFINITIVAMENTE'}
          </button>
        </div>
      </div>
    </div>
  )
}
