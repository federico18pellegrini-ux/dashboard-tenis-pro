import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PromoteToStudentModal } from '@/components/contacts/PromoteToStudentModal'
import { AddContactModal } from '@/components/contacts/AddContactModal'
import { ContactActionsMenu } from '@/components/contacts/ContactActionsMenu'
import { formatPhoneForDisplay } from '@/lib/utils/phone'
import { formatStudentLevel } from '@/lib/levels'

function contactosHref(parts: { status: string; prospecto_creado?: string }, q: string) {
  const p = new URLSearchParams()
  p.set('status', parts.status)
  if (parts.prospecto_creado) p.set('prospecto_creado', parts.prospecto_creado)
  if (q.trim()) p.set('q', q.trim())
  return `/dashboard/contactos?${p.toString()}`
}

function segmentTabClass(active: boolean) {
  return [
    'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-lg whitespace-nowrap',
    active
      ? 'bg-[var(--color-accent)] text-white border-transparent'
      : 'bg-[var(--color-bg-card-inner)] text-[var(--color-text-body)] border-black/10 hover:border-[var(--color-accent)]',
  ].join(' ')
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; prospecto_creado?: string }>
}) {
  const raw = await searchParams
  const q = typeof raw.q === 'string' ? raw.q : ''
  const prospecto_creado = typeof raw.prospecto_creado === 'string' ? raw.prospecto_creado : undefined
  const statusRaw = typeof raw.status === 'string' ? raw.status.trim() : ''
  const allowed = new Set(['student', 'unclassified', 'all'])
  if (!statusRaw || !allowed.has(statusRaw)) {
    const p = new URLSearchParams()
    p.set('status', 'student')
    if (q.trim()) p.set('q', q.trim())
    if (prospecto_creado === '1') p.set('prospecto_creado', '1')
    redirect(`/dashboard/contactos?${p.toString()}`)
  }
  const status = statusRaw as 'student' | 'unclassified' | 'all'

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch de contactos con filtros
  let query = supabase
    .from('contacts')
    .select(`
      *,
      student:students(
        level,
        club_id,
        club:clubs(name)
      )
    `)
  
  if (status !== 'all') {
    query = query.eq('status', status)
  }
  
  if (q) {
    query = query.ilike('full_name', `%${q}%`)
  }

  // FIX: Tipado explícito para evitar 'never[]'
  const { data: contactsData } = await query.order('full_name')
  const contacts: any[] = contactsData || []

  // 2. Fetch de sedes (Clubes)
  const { data: clubsData } = await supabase.from('clubs').select('*').order('name')
  const clubs: any[] = clubsData || []

  // 3. Métricas
  const [totalRes, unclassifiedRes, studentsRes] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'unclassified'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'student')
  ])

  const total = totalRes.count || 0
  const unclassified = unclassifiedRes.count || 0
  const studentsCount = studentsRes.count || 0

  const today = new Date()
  const calHref = `/dashboard/calendario?month=${today.getMonth() + 1}&year=${today.getFullYear()}`

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8 font-sans selection:bg-[#bdfd2c] selection:text-slate-950 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="space-y-5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 bg-[var(--color-bg-card-inner)] border border-black/10 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Volver al dashboard"
            >
              ← Volver
            </Link>
            <Link
              href="/dashboard/caja"
              className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-black/10 p-3 rounded-2xl text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Caja"
            >
              <span aria-hidden className="text-base leading-none">💰</span>
            </Link>
            <Link
              href={calHref}
              className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-black/10 p-3 rounded-2xl text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Calendario"
            >
              <span aria-hidden className="text-base leading-none">📅</span>
            </Link>
            <Link
              href="/dashboard/torneos"
              className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-black/10 p-3 rounded-2xl text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Torneos y cancha abierta"
            >
              <span aria-hidden className="text-base leading-none">🏆</span>
            </Link>
            <h1 className="flex-1 text-center text-2xl md:text-3xl font-black tracking-tighter text-[var(--color-text-heading)] uppercase italic">
              Contactos
            </h1>
          </div>

        </header>

        <nav
          className="flex flex-col gap-3 border-b border-black/10 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
          aria-label="Vista de contactos"
        >
          <div className="flex flex-wrap gap-2">
            <Link
              href={contactosHref({ status: 'student' }, q)}
              className={segmentTabClass(status === 'student')}
              aria-current={status === 'student' ? 'page' : undefined}
            >
              <span>Alumnos</span>
              <span className="tabular-nums opacity-80">({studentsCount})</span>
            </Link>
            <Link
              href={contactosHref({ status: 'unclassified' }, q)}
              className={segmentTabClass(status === 'unclassified')}
              aria-current={status === 'unclassified' ? 'page' : undefined}
            >
              <span>Pendientes</span>
              <span className="tabular-nums opacity-80">({unclassified})</span>
            </Link>
            <Link
              href={contactosHref({ status: 'all' }, q)}
              className={segmentTabClass(status === 'all')}
              aria-current={status === 'all' ? 'page' : undefined}
            >
              <span>Todos</span>
              <span className="tabular-nums opacity-80">({total})</span>
            </Link>
          </div>
          <div className="shrink-0 [&_button]:w-full sm:[&_button]:w-auto">
            <AddContactModal />
          </div>
        </nav>

        {prospecto_creado === '1' && status === 'unclassified' && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-bold text-[var(--color-text-heading)] leading-snug">
              Posible alumno guardado. Ya estás viendo Pendientes: acá están los que aún no convertiste en alumno.
            </p>
            <Link
              href={contactosHref({ status: 'unclassified' }, q)}
              className="shrink-0 inline-flex items-center justify-center text-center text-[10px] font-black uppercase tracking-widest text-[var(--color-accent)] underline underline-offset-2 hover:opacity-90"
            >
              Cerrar aviso
            </Link>
          </div>
        )}

        {/* LISTA MOBILE-FIRST */}
        <div className="space-y-3 pb-10">
          {contacts.map((contact) => {
            const phoneDigits = String(contact.phone || '').replace(/\D/g, '')
            const waHref = phoneDigits ? `https://wa.me/${phoneDigits}` : null
            const levelRaw = contact.student?.level as string | undefined
            const levelLabel = formatStudentLevel(levelRaw)
            const clubName = (contact.student?.club?.name as string | undefined) ?? null

            return (
              <div
                key={contact.id}
                className="bg-[var(--color-bg-card-inner)]/80 bg-[var(--color-bg-card)]/30 rounded-3xl border border-black/10  shadow-2xl overflow-hidden"
              >
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-page)] border border-black/10  flex items-center justify-center font-black text-[var(--color-text-body)] text-[var(--color-text-body)] shrink-0">
                      {(contact.full_name || '?')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n: string) => n[0]?.toUpperCase())
                        .join('') || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <p className="text-sm font-black text-[var(--color-text-body)] text-[var(--color-text-heading)] uppercase tracking-tight leading-tight truncate">
                          {contact.full_name}
                        </p>
                        {status === 'all' && (
                          <span
                            className={[
                              'shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border',
                              contact.status === 'student'
                                ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                                : 'border-amber-500/40 text-amber-800 dark:text-amber-200 bg-amber-500/10',
                            ].join(' ')}
                          >
                            {contact.status === 'student' ? 'Alumno' : 'Pendiente'}
                          </span>
                        )}
                      </div>

                      {waHref ? (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-2 text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                        >
                          <span className="text-[var(--color-accent)] dark:text-[var(--color-accent)] font-medium">WA</span>
                          <span className="text-[var(--color-text-body)] font-bold normal-case tracking-normal">
                            {formatPhoneForDisplay(contact.phone)}
                          </span>
                        </a>
                      ) : (
                        <p className="mt-2 text-xs font-bold text-[var(--color-text-body)] dark:text-[var(--color-text-body)] uppercase tracking-widest">
                          Sin teléfono
                        </p>
                      )}

                      {(levelLabel || clubName) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {levelLabel && (
                            <span className="text-xs font-bold bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-page)]/60 text-[var(--color-text-body)] text-[var(--color-text-body)] px-2.5 py-1 rounded-lg border border-black/10 ">
                              {levelLabel}
                            </span>
                          )}
                          {clubName && (
                            <span className="text-xs font-bold bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-page)]/60 text-[var(--color-text-body)] text-[var(--color-text-body)] px-2.5 py-1 rounded-lg border border-black/10 ">
                              {clubName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {contact.status === 'unclassified' && (
                      <PromoteToStudentModal contact={contact} clubs={clubs} />
                    )}
                    <ContactActionsMenu contact={contact} clubs={clubs} />
                  </div>
                </div>
              </div>
            )
          })}

          {contacts.length === 0 && (
            <div className="p-10 text-center space-y-3 text-xs text-[var(--color-text-body)] dark:text-[var(--color-text-body)] font-bold uppercase tracking-widest border border-black/10  rounded-3xl bg-[var(--color-bg-card-inner)]/50 bg-[var(--color-bg-card)]/20">
              <p>No hay contactos para este filtro</p>
              {status === 'student' && (
                <p className="normal-case font-bold text-[10px] text-[var(--color-text-muted)] max-w-md mx-auto leading-relaxed">
                  Los posibles alumnos nuevos quedan en{' '}
                  <Link
                    href={contactosHref({ status: 'unclassified' }, q)}
                    className="text-[var(--color-accent)] underline underline-offset-2"
                  >
                    Pendientes
                  </Link>
                  , no acá.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}