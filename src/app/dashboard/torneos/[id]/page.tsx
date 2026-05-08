import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { buildWhatsAppTournamentLink } from '@/lib/utils/whatsapp'
import { AddStudentToCategoryPanel } from '@/components/dashboard/AddStudentToCategoryPanel'
import { addCategory, registerTournamentPayment, updateTournamentStatus } from '../actions'

function formatPesos(amountCents: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format((amountCents || 0) / 100)
}

function formatDateEsAR(dateIso: string | null | undefined) {
  if (!dateIso) return '—'
  const d = new Date(dateIso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type Params = Promise<{ id: string }>

export default async function TournamentDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const tournamentId = String(id)

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [tRes, clubsRes, studentsRes] = await Promise.all([
    supabase
      .from('tournaments')
      .select(`
        *,
        categories:tournament_categories!tournament_categories_tournament_id_fkey(
          id,
          name,
          club_id,
          price_cents,
          club:clubs(name),
          enrollments:tournament_students(
            student_id,
            category_id,
            payment_status,
            payment_method,
            paid_at,
            student:students(full_name, phone)
          )
        )
      `)
      .eq('id', tournamentId)
      .single(),
    supabase.from('clubs').select('id, name').order('name'),
    supabase.from('students').select('id, full_name').order('full_name'),
  ])

  if (tRes.error || !tRes.data) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8 font-sans">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link href="/dashboard/torneos" className="inline-flex items-center gap-2 bg-[var(--color-bg-card-inner)] border border-[var(--color-border)] px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shrink-0">
            &lt; Volver
          </Link>
          <div className="p-10 text-center text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest border border-[var(--color-border)] rounded-3xl bg-[var(--color-bg-card-inner)]/50">
            No se encontró el torneo
          </div>
        </div>
      </div>
    )
  }

  const tournament: any = tRes.data
  const clubs = (clubsRes.data ?? []) as Array<{ id: string; name: string }>
  const students = (studentsRes.data ?? []) as Array<{ id: string; full_name: string }>

  const categories = (tournament.categories ?? []) as any[]

  async function addCategoryAction(formData: FormData) {
    'use server'
    const name = String(formData.get('name') || '').trim()
    const clubId = String(formData.get('club_id') || '').trim()
    const pricePesos = Number(formData.get('price_pesos') || 0)
    const priceCents = Math.round((Number.isFinite(pricePesos) ? pricePesos : 0) * 100)
    await addCategory(tournamentId, name, clubId, priceCents)
  }

  async function payAction(formData: FormData) {
    'use server'
    const studentId = String(formData.get('student_id') || '').trim()
    const method = String(formData.get('method') || 'cash')
    const amountCents = Number(formData.get('amount_cents') || 0)
    const studentName = String(formData.get('student_name') || '')
    await registerTournamentPayment(tournamentId, studentId, method, amountCents, String(tournament.name), studentName)
  }

  async function removeStudentAction(formData: FormData) {
    'use server'
    const studentId = String(formData.get('student_id') || '').trim()
    const categoryId = String(formData.get('category_id') || '').trim()
    const supabase = await createSupabaseServerClient()
    await supabase
      .from('tournament_students')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('student_id', studentId)
      .eq('category_id', categoryId)
    revalidatePath(`/dashboard/torneos/${tournamentId}`)
  }

  async function statusAction(formData: FormData) {
    'use server'
    const status = String(formData.get('status') || '').trim()
    await updateTournamentStatus(tournamentId, status)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8 font-sans selection:bg-[var(--color-accent)] selection:text-[var(--color-text-heading)] overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-5">
          <div className="flex items-center justify-start">
            <Link
              href="/dashboard/torneos"
              className="group bg-[var(--color-bg-card-inner)] border border-[var(--color-border)] p-3 rounded-2xl hover:border-[var(--color-accent)] transition-all shadow-xl"
              aria-label="Volver a torneos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
          </div>

          <div className="flex flex-col items-stretch gap-3">
            <h1 className="text-center text-2xl md:text-4xl font-black tracking-tighter text-[var(--color-text-heading)] uppercase italic leading-none">
              {String(tournament.name ?? 'Torneo')}
            </h1>
            <p className="text-center text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] leading-none">
              {formatDateEsAR(tournament.start_date)} → {formatDateEsAR(tournament.end_date)} • Estado: {String(tournament.status ?? 'Próximo')}
            </p>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <details className="group">
                <summary className="cursor-pointer list-none inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-[var(--color-border)] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl">
                  + Agregar Categoría
                </summary>
                <div className="mt-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl p-5 shadow-2xl max-w-xl">
                  <form action={addCategoryAction} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1.5 ml-1">
                          Nombre
                        </label>
                        <input
                          name="name"
                          required
                          className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none focus:border-[var(--color-accent)] transition-all"
                          placeholder="Ej: 5ta"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1.5 ml-1">
                          Sede
                        </label>
                        <select
                          name="club_id"
                          required
                          className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none focus:border-[var(--color-accent)] transition-all"
                        >
                          {clubs.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-1">
                        <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1.5 ml-1">
                          Precio ($)
                        </label>
                        <input
                          name="price_pesos"
                          type="number"
                          min={0}
                          step={1}
                          required
                          className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none focus:border-[var(--color-accent)] transition-all"
                          placeholder="Ej: 15000"
                        />
                      </div>
                    </div>

                    <button className="w-full bg-[var(--color-accent-secondary)] text-[var(--color-text-heading)] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                      Guardar categoría
                    </button>
                  </form>
                </div>
              </details>

              <details className="group">
                <summary className="cursor-pointer list-none inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-[var(--color-border)] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl">
                  Cambiar estado
                </summary>
                <div className="mt-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl p-5 shadow-2xl max-w-xl">
                  <form action={statusAction} className="space-y-3">
                    <select
                      name="status"
                      defaultValue={String(tournament.status ?? 'Próximo')}
                      className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none focus:border-[var(--color-accent)] transition-all"
                    >
                      <option value="Próximo">Próximo</option>
                      <option value="En curso">En curso</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                    <button className="w-full bg-[var(--color-accent-secondary)] text-[var(--color-text-heading)] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                      Actualizar estado
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        <div className="space-y-4 pb-10">
          {categories.map((cat) => {
            const enrollments = Array.isArray(cat.enrollments) ? cat.enrollments : []
            const total = enrollments.length
            const paid = enrollments.filter((e: any) => String(e?.payment_status ?? '').toLowerCase() === 'paid').length

            return (
              <section
                key={String(cat.id)}
                className="bg-[var(--color-bg-card-inner)]/80 rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden"
              >
                <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-[var(--color-text-body)] uppercase tracking-tight truncate">
                      {String(cat.name ?? 'Categoría')}
                    </h2>
                    <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">
                      {String(cat?.club?.name ?? 'Sede')} • {formatPesos(Number(cat.price_cents || 0))} • {paid}/{total} pagaron
                    </p>
                  </div>

                  <AddStudentToCategoryPanel
                    tournamentId={tournamentId}
                    categoryId={String(cat.id)}
                    students={students}
                  />
                </div>

                <div className="divide-y divide-[var(--color-border)]">
                  {enrollments.length === 0 && (
                    <div className="p-6 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                      Sin alumnos anotados
                    </div>
                  )}

                  {enrollments.map((e: any) => {
                    const studentName = String(e?.student?.full_name ?? 'Alumno')
                    const studentId = String(e?.student_id ?? '')
                    const paid = String(e?.payment_status ?? '').toLowerCase() === 'paid'

                    return (
                      <div key={String(e.student_id)} className="p-5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[var(--color-text-body)] uppercase tracking-tight truncate">
                            {studentName}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {paid ? (
                              <span className="text-[var(--color-success)]">✓ pagado</span>
                            ) : (
                              <span className="text-[var(--color-accent)]">COBRAR</span>
                            )}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {!paid &&
                            (() => {
                              const phone = String(e?.student?.phone ?? '')
                              const waHref = phone
                                ? buildWhatsAppTournamentLink({
                                    studentName: String(e?.student?.full_name ?? ''),
                                    studentPhone: phone,
                                    tournamentName: String(tournament.name),
                                    categoryName: String(cat.name),
                                    clubName: String(cat?.club?.name ?? ''),
                                    amountCents: Number(cat.price_cents || 0),
                                  })
                                : null
                              return waHref ? (
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                                >
                                  WA
                                </a>
                              ) : null
                            })()}
                          {!paid ? (
                            <form action={payAction} className="flex items-center gap-2">
                              <input type="hidden" name="student_id" value={studentId} />
                              <input type="hidden" name="amount_cents" value={String(cat.price_cents || 0)} />
                              <input type="hidden" name="student_name" value={String(e?.student?.full_name ?? '')} />
                              <select
                                name="method"
                                defaultValue="cash"
                                className="bg-[var(--color-bg-card-inner)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-body)] outline-none"
                              >
                                <option value="cash">cash</option>
                                <option value="transfer">transfer</option>
                                <option value="mp">mp</option>
                              </select>
                              <button
                                type="submit"
                                formAction={payAction}
                                className="bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-success)]/15 transition-colors disabled:opacity-50"
                              >
                                Registrar pago
                              </button>
                            </form>
                          ) : (
                            <span className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[var(--color-bg-card-inner)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                              Pagado
                            </span>
                          )}
                          <form action={removeStudentAction}>
                            <input type="hidden" name="student_id" value={studentId} />
                            <input type="hidden" name="category_id" value={String(e?.category_id ?? '')} />
                            <button
                              type="submit"
                              className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-600/30 text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              ✕
                            </button>
                          </form>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {categories.length === 0 && (
            <div className="p-10 text-center text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest border border-[var(--color-border)] rounded-3xl bg-[var(--color-bg-card-inner)]/50">
              Todavía no hay categorías. Usá &quot;+ Agregar Categoría&quot; para empezar.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

