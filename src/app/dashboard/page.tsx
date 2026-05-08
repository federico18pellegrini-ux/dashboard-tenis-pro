import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PaymentButton } from '@/components/dashboard/PaymentButton'
import { getCurrentMonthAR } from '@/lib/utils/calendar'
import { AddStudentModal } from '@/components/dashboard/AddStudentModal'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { whatsappLink } from '@/lib/whatsapp/links'
import { HourlyGrid } from '@/components/dashboard/HourlyGrid'
import { CreateClassLauncher } from '@/components/dashboard/CreateClassModal'
import { WeekClasses } from '@/components/dashboard/WeekClasses'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string; month?: string; year?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { club, month: queryMonth, year: queryYear } = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // --- LÓGICA DE FECHAS ---
  const now = getCurrentMonthAR()
  const month = queryMonth ? parseInt(queryMonth) : now.month + 1
  const year = queryYear ? parseInt(queryYear) : now.year

  const firstDayOfMonth = new Date(year, month - 1, 1).toISOString()
  const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString()

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const currentMonthName = monthNames[month - 1];

  const selectedMonth = Number(queryMonth ?? new Date().getMonth() + 1)
  const selectedYear = Number(queryYear ?? new Date().getFullYear())
  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
  startOfMonth.setHours(0, 0, 0, 0)
  const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999)

  // --- FETCH DE DATOS ---
  const [studentsRes, schedulesRes, clubsRes, paymentsRes, availabilityRes, weekClassesRes] = await Promise.all([
    supabase.from('students').select('*, clubs(name)'),
    supabase.from('schedules').select(`
      *, 
      students(id, full_name, phone, level, price_per_class_cents, club_id, active),
      clubs(name)
    `),
    supabase.from('clubs').select('*').order('name', { ascending: true }),
    supabase.from('payments').select('*')
      .gte('payment_date', firstDayOfMonth)
      .lte('payment_date', lastDayOfMonth),
    supabase.from('availability_slots').select('club_id, day_of_week, start_time, active, duration_minutes'),
    supabase
      .from('classes')
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        price_cents,
        status,
        club:clubs(name),
        students:class_students(
          paid,
          paid_amount,
          payment_method,
          student_id,
          student:students(full_name, phone)
        )
      `)
      .gte('scheduled_at', startOfMonth.toISOString())
      .lte('scheduled_at', endOfMonth.toISOString())
      .order('scheduled_at', { ascending: true }),
  ])

  const schedules = schedulesRes.data || []
  const clubs = clubsRes.data || []
  const payments = paymentsRes.data || []
  const availabilitySlots = availabilityRes.data || []
  const students = studentsRes.data || []
  const weekClasses = weekClassesRes.data || []

  const currentClubId = clubs.find(c => c.name === club)?.id ?? null
  const filteredSchedules = currentClubId ? schedules.filter(s => s.club_id === currentClubId) : schedules

  const debtorIds = new Set(filteredSchedules.filter(s => !payments.some(p => p.student_id === s.student_id)).map(s => s.student_id))
  const debtors = studentsRes.data?.filter(st => debtorIds.has(st.id)) || []

  const normalizedWeekClasses = (weekClasses ?? []).map((c: any) => ({
    ...c,
    students: (c.students ?? []).map((cs: any) => ({
      full_name: cs.student?.full_name ?? '',
      phone: cs.student?.phone ?? '',
      student_id: cs.student_id,
      paid: cs.paid,
      paid_amount: cs.paid_amount,
      payment_method: cs.payment_method,
    })),
  }))

  const classesPaidTotalCents = normalizedWeekClasses.reduce((acc: number, c: any) => {
    const students = Array.isArray(c.students) ? c.students : []
    return (
      acc +
      students.reduce((sAcc: number, s: any) => {
        if (!s?.paid) return sAcc
        return sAcc + Number(s.paid_amount || 0)
      }, 0)
    )
  }, 0)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8 font-sans selection:bg-[#bdfd2c] selection:text-slate-950 overflow-x-hidden max-w-full">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="space-y-6">
          <div className="w-full max-w-full space-y-4">
            {/* Fila 1 (mobile): título */}
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg md:text-4xl font-black tracking-tighter text-[var(--color-text-heading)]  uppercase italic leading-none">
                Padel Sartori Control
              </h1>
            </div>

            {/* Fila 2 (mobile): mes + navegación */}
            <div className="flex items-center justify-between gap-3 max-w-full">
              <div className="min-w-0">
                <MonthSelector currentMonth={month} currentYear={year} />
              </div>
              <nav className="shrink-0 flex items-center gap-2">
                <Link
                  href="/dashboard/contactos"
                  className="inline-flex items-center gap-1.5 bg-[var(--color-bg-card-inner)] dark:bg-[var(--color-bg-card)] border border-black/10  px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-body)] dark:text-[var(--color-text-body)] hover:border-[var(--color-accent)]  hover:text-[var(--color-accent)]  transition-colors shadow-xl"
                >
                  <span aria-hidden>👥</span>
                  <span className="hidden sm:inline">Contactos</span>
                </Link>
                <Link
                  href="/dashboard/caja"
                  className="inline-flex items-center gap-1.5 bg-[var(--color-bg-card-inner)] dark:bg-[var(--color-bg-card)] border border-black/10  px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-body)] dark:text-[var(--color-text-body)] hover:border-[var(--color-accent)]  hover:text-[var(--color-accent)]  transition-colors shadow-xl"
                >
                  <span aria-hidden>💰</span>
                  <span className="hidden sm:inline">Caja</span>
                </Link>
                <Link
                  href={`/dashboard/calendario?month=${month}&year=${year}`}
                  className="inline-flex items-center gap-1.5 bg-[var(--color-bg-card-inner)] dark:bg-[var(--color-bg-card)] border border-black/10  px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-body)] dark:text-[var(--color-text-body)] hover:border-[var(--color-accent)]  hover:text-[var(--color-accent)]  transition-colors shadow-xl"
                >
                  <span aria-hidden>📅</span>
                  <span className="hidden sm:inline">Calendario</span>
                </Link>
              </nav>
            </div>

            {/* Fila 3 (mobile): acciones */}
            <div className="w-full md:flex md:justify-end">
              <div className="w-full flex flex-row items-center gap-2 md:w-auto md:justify-end [&_button]:h-11 [&_button]:px-4 [&_button]:text-sm [&_button]:rounded-xl">
                <div className="flex-1 md:flex-none">
                  <AddStudentModal clubs={clubs} />
                </div>
                <div className="flex-1 md:flex-none">
                  <CreateClassLauncher
                    clubs={clubs.map((c) => ({ id: c.id, name: c.name }))}
                    students={students.map((s: any) => ({ id: s.id, full_name: s.full_name }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <WeekClasses
          classes={normalizedWeekClasses}
          allStudents={students.map((s: any) => ({ id: s.id, full_name: s.full_name }))}
          paidTotalCents={classesPaidTotalCents}
        />

        {false && (
          <>
            {/* SECCIÓN CENTRAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2 bg-[var(--color-bg-card)] rounded-[2.5rem] border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col h-[450px]">
                <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-page)]/40">
                  <h2 className="text-xs font-black text-white uppercase tracking-[0.15em] italic">Deuda Vencida</h2>
                  <span className="text-[10px] font-black bg-[var(--color-bg-page)] border border-[var(--color-border)] text-[var(--color-accent)]  px-4 py-2 rounded-xl uppercase tracking-widest">{debtors.length} PENDIENTES</span>
                </div>
                <div className="divide-y divide-[var(--color-border)] overflow-y-auto custom-scrollbar">
                  {debtors.map((debtor) => {
                    const formattedPrice = new Intl.NumberFormat('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                      maximumFractionDigits: 0
                    }).format(debtor.price_per_class_cents / 100);

                    const waMessage = `Hola ${debtor.full_name.split(' ')[0]}! Te recuerdo que tenés pendiente la mensualidad de ${currentMonthName} (${formattedPrice}). ¿Me confirmás el pago cuando puedas? Gracias 🎾`;
                    const waHref = whatsappLink(debtor.phone, waMessage);

                    return (
                      <div key={debtor.id} className="p-6 flex items-center justify-between hover:bg-[var(--color-bg-card-inner)]/40 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-[var(--color-bg-page)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] font-black text-sm group-hover:border-[#bdfd2c] transition-all">
                            {debtor.full_name.split(' ').map((n: any) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-black text-[var(--color-text-heading)] uppercase tracking-tight mb-1 leading-none">{debtor.full_name}</p>
                            <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">
                              {schedules.find(s => s.student_id === debtor.id)?.clubs?.name || 'Sede'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <a 
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all shadow-lg"
                            title="Enviar recordatorio de WhatsApp"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                          </a>
                          <PaymentButton studentId={debtor.id} amount={debtor.price_per_class_cents || 0} studentName={debtor.full_name} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            {/* TABS DE SEDES */}
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-[var(--color-border)]/60">
              <Link href="/dashboard" className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${!club ? 'bg-[var(--color-accent)] text-white  shadow-lg' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}>
                TODAS LAS SEDES
              </Link>
              {clubs.map((c) => (
                <Link key={c.id} href={`/dashboard?club=${encodeURIComponent(c.name)}`} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${club === c.name ? 'bg-[var(--color-accent)] text-white  shadow-lg' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'}`}>
                  {c.name}
                </Link>
              ))}
            </div>

            <HourlyGrid
              clubs={clubs}
              schedules={schedules}
              availabilitySlots={availabilitySlots}
              paymentsThisMonth={payments}
              selectedClubId={currentClubId}
            />
          </>
        )}
      </div>
    </div>
  )
}