'use client'

import Link from 'next/link'

type TournamentStatus = 'upcoming' | 'in_progress' | 'finished'

type TournamentCardModel = {
  id: string
  name: string
  startDateLabel: string
  endDateLabel: string
  status: TournamentStatus
  categories: Array<{
    id: string
    name: string
    clubName: string
    priceCents: number
  }>
  totalStudents: number
  paidStudents: number
  totalCollectedCents: number
}

function formatPesos(amountCents: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format((amountCents || 0) / 100)
}

function statusLabel(s: TournamentStatus) {
  if (s === 'upcoming') return 'Próximo'
  if (s === 'in_progress') return 'En curso'
  return 'Finalizado'
}

function statusClasses(s: TournamentStatus) {
  if (s === 'upcoming') {
    return 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20'
  }
  if (s === 'in_progress') {
    return 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20'
  }
  return 'bg-[var(--color-bg-card-inner)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
}

export function TournamentCard({ tournament }: { tournament: TournamentCardModel }) {
  return (
    <div className="bg-[var(--color-bg-card-inner)]/80 rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden">
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-[var(--color-text-body)] uppercase tracking-tight leading-tight truncate">
              {tournament.name}
            </p>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusClasses(tournament.status)}`}>
              {statusLabel(tournament.status)}
            </span>
          </div>

          <p className="mt-2 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
            {tournament.startDateLabel} → {tournament.endDateLabel}
          </p>

          {tournament.categories.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {tournament.categories.slice(0, 6).map((c) => (
                <span
                  key={c.id}
                  className="text-xs font-bold bg-[var(--color-bg-card-inner)] text-[var(--color-text-body)] px-2.5 py-1 rounded-lg border border-[var(--color-border)]"
                >
                  {c.name} • {c.clubName} • {formatPesos(c.priceCents)}
                </span>
              ))}
              {tournament.categories.length > 6 && (
                <span className="text-xs font-bold bg-[var(--color-bg-card-inner)]/60 text-[var(--color-text-muted)] px-2.5 py-1 rounded-lg border border-[var(--color-border)]">
                  +{tournament.categories.length - 6} más
                </span>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
              Sin categorías
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
            <span className="text-[var(--color-text-muted)]">
              Inscriptos: <span className="text-[var(--color-text-body)]">{tournament.totalStudents}</span>
            </span>
            <span className="text-[var(--color-text-muted)]">
              Pagaron: <span className="text-[var(--color-text-body)]">{tournament.paidStudents}</span>
            </span>
            <span className="text-[var(--color-text-muted)]">
              Cobrado: <span className="text-[var(--color-success)]">{formatPesos(tournament.totalCollectedCents)}</span>
            </span>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href={`/dashboard/torneos/${tournament.id}`}
            className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-[var(--color-border)] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl whitespace-nowrap"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  )
}

