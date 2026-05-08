import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreateTournamentModal } from '@/components/dashboard/CreateTournamentModal'
import { TournamentCard } from '@/components/dashboard/TournamentCard'

function formatPesos(amountCents: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format((amountCents || 0) / 100)
}

function formatDateEsAR(dateIsoOrDate: string | null | undefined) {
  if (!dateIsoOrDate) return '—'
  const d = new Date(dateIsoOrDate)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function computeTournamentStatus(t: any): 'Próximo' | 'En curso' | 'Finalizado' {
  const raw = String(t?.status ?? '').toLowerCase()
  if (raw === 'Próximo' || raw === 'En curso' || raw === 'Finalizado') return raw

  const now = new Date()
  const start = t?.start_date ? new Date(t.start_date) : null
  const end = t?.end_date ? new Date(t.end_date) : null
  if (end && end.getTime() < now.getTime()) return 'Finalizado'
  if (start && start.getTime() <= now.getTime()) return 'En curso'
  return 'Próximo'
}

export default async function TournamentsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [tournamentsRes, clubsRes] = await Promise.all([
    supabase
      .from('tournaments')
      .select(`
        *,
        categories:tournament_categories!tournament_categories_tournament_id_fkey(
          id,
          name,
          club_id,
          price_cents,
          club:clubs(name)
        ),
        students:tournament_students(
          student_id,
          category_id,
          payment_status
        )
      `)
      .order('start_date', { ascending: false }),
    supabase.from('clubs').select('id, name').order('name'),
  ])

  const tournaments = (tournamentsRes.data ?? []) as any[]
  const clubs = (clubsRes.data ?? []) as Array<{ id: string; name: string }>

  const list = tournaments.map((t) => {
    const categories = Array.isArray(t.categories) ? t.categories : []
    const students = Array.isArray(t.students) ? t.students : []

    const status = computeTournamentStatus(t)

    const totalStudents = students.length
    const paidStudents = students.filter((s: any) => String(s?.payment_status ?? '').toLowerCase() === 'paid').length

    const priceByCategoryId = new Map<string, number>(
      categories
        .filter((c: any) => c?.id)
        .map((c: any) => [String(c.id), Number(c.price_cents || 0)]),
    )

    const totalCollectedCents = students.reduce((acc: number, s: any) => {
      const paid = String(s?.payment_status ?? '').toLowerCase() === 'paid'
      if (!paid) return acc
      const fallback = priceByCategoryId.get(String(s?.category_id ?? '')) ?? 0
      return acc + fallback
    }, 0)

    return {
      id: String(t.id),
      name: String(t.name ?? 'Torneo'),
      notes: (t.notes as string | null) ?? null,
      startDateLabel: formatDateEsAR(t.start_date ?? null),
      endDateLabel: formatDateEsAR(t.end_date ?? null),
      status,
      categories: categories.map((c: any) => ({
        id: String(c.id),
        name: String(c.name ?? 'Categoría'),
        clubName: String(c?.club?.name ?? 'Sede'),
        priceCents: Number(c.price_cents || 0),
      })),
      totalStudents,
      paidStudents,
      totalCollectedCents,
    }
  })

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8 font-sans selection:bg-[var(--color-accent)] selection:text-[var(--color-text-heading)] overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-5">
          <div className="flex items-center justify-start">
            <Link
              href="/dashboard"
              className="group bg-[var(--color-bg-card-inner)] border border-[var(--color-border)] p-3 rounded-2xl hover:border-[var(--color-accent)] transition-all shadow-xl"
              aria-label="Volver al dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
          </div>

          <div className="flex flex-col items-stretch gap-3">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-center flex-1 text-3xl md:text-4xl font-black tracking-tighter text-[var(--color-text-heading)] uppercase italic leading-none">
                Torneos
              </h1>
              <div className="shrink-0">
                <CreateTournamentModal clubs={clubs} />
              </div>
            </div>
            <p className="text-center text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] leading-none">
              {list.length} TORNEOS • TOTAL COBRADO: {formatPesos(list.reduce((acc, t) => acc + (t.totalCollectedCents || 0), 0))}
            </p>
          </div>
        </header>

        <div className="space-y-3 pb-10">
          {list.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}

          {list.length === 0 && (
            <div className="p-10 text-center text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest border border-[var(--color-border)] rounded-3xl bg-[var(--color-bg-card-inner)]/50">
              No hay torneos todavía
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

