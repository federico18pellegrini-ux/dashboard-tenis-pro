import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PromoteToStudentModal } from '@/components/contacts/PromoteToStudentModal'
import { AddContactModal } from '@/components/contacts/AddContactModal'
import { ContactActionsMenu } from '@/components/contacts/ContactActionsMenu'
import { formatPhoneForDisplay } from '@/lib/utils/phone'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { status = 'student', q = '' } = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
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
          <div className="flex items-center justify-start">
            <Link 
              href="/dashboard" 
              className="group bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] border border-black/10  p-3 rounded-2xl hover:border-[var(--color-accent)]  transition-all shadow-xl"
              aria-label="Volver al dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)]  transition-colors">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </Link>
          </div>

          <div className="flex flex-col items-stretch gap-3">
            <h1 className="text-center text-3xl md:text-4xl font-black tracking-tighter text-gray-950  uppercase italic leading-none w-full">
              Contactos
            </h1>
            <div className="flex justify-end gap-2">
              <Link
                href="/dashboard/caja"
                className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] border border-black/10  px-3 py-2 rounded-xl text-[var(--color-text-body)] text-[var(--color-text-body)] hover:border-[var(--color-accent)]  hover:text-[var(--color-accent)]  transition-colors shadow-xl"
                aria-label="Caja"
              >
                <span aria-hidden className="text-base leading-none">💰</span>
              </Link>
              <Link
                href={calHref}
                className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] border border-black/10  px-3 py-2 rounded-xl text-[var(--color-text-body)] text-[var(--color-text-body)] hover:border-[var(--color-accent)]  hover:text-[var(--color-accent)]  transition-colors shadow-xl"
                aria-label="Calendario"
              >
                <span aria-hidden className="text-base leading-none">📅</span>
              </Link>
            </div>
            <p className="text-center text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-[0.2em] leading-none">
              {total} TOTAL • {studentsCount} ALUMNOS • {unclassified} PENDIENTES
            </p>
          </div>

          <div className="w-full max-w-lg mx-auto">
            <AddContactModal />
          </div>
        </header>

        {/* NAVEGACIÓN */}
        <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-black/10 ">
          <Link
            href="/dashboard/contactos?status=student"
            className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap bg-[var(--color-accent)] text-white  shadow-lg "
          >
            Alumnos
          </Link>
        </div>

        {/* LISTA MOBILE-FIRST */}
        <div className="space-y-3 pb-10">
          {contacts.map((contact) => {
            const phoneDigits = String(contact.phone || '').replace(/\D/g, '')
            const waHref = phoneDigits ? `https://wa.me/${phoneDigits}` : null
            const levelRaw = contact.student?.level as string | undefined
            const levelLabel =
              levelRaw === 'principiante'
                ? 'Principiante'
                : levelRaw === 'intermedio'
                  ? 'Intermedio'
                  : levelRaw === 'avanzado'
                    ? 'Avanzado'
                    : null
            const clubName = (contact.student?.club?.name as string | undefined) ?? null

            return (
              <div
                key={contact.id}
                className="bg-[var(--color-bg-card-inner)]/80 bg-[var(--color-bg-card)]/30 rounded-3xl border border-black/10  shadow-2xl overflow-hidden"
              >
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-page)] border border-black/10  flex items-center justify-center font-black text-[var(--color-text-muted)] text-[var(--color-text-muted)] shrink-0">
                      {(contact.full_name || '?')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n: string) => n[0]?.toUpperCase())
                        .join('') || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[var(--color-text-body)] text-[var(--color-text-heading)] uppercase tracking-tight leading-tight truncate">
                        {contact.full_name}
                      </p>

                      {waHref ? (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-2 text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                        >
                          <span className="text-[var(--color-accent)] dark:text-[var(--color-accent)] font-medium">WA</span>
                          <span className="text-gray-700 text-[var(--color-text-body)] font-bold normal-case tracking-normal">
                            {formatPhoneForDisplay(contact.phone)}
                          </span>
                        </a>
                      ) : (
                        <p className="mt-2 text-xs font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-widest">
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
            <div className="p-10 text-center text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold uppercase tracking-widest border border-black/10  rounded-3xl bg-[var(--color-bg-card-inner)]/50 bg-[var(--color-bg-card)]/20">
              No hay contactos para este filtro
            </div>
          )}
        </div>
      </div>
    </div>
  )
}