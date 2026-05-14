import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { CalendarMonthGrid, type CalendarClassChip } from '@/components/dashboard/CalendarMonthGrid'

function dayKeyLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function abbrevClub(fullName: string | null | undefined): string {
  const n = (fullName ?? '').toLowerCase()
  if (n.includes('cuba')) return 'Cuba'
  if (n.includes('río') || n.includes('rio')) return 'Río'
  if (n.includes('palermo')) return 'Pal.'
  return (fullName ?? 'Club').slice(0, 4) + (fullName && fullName.length > 4 ? '.' : '')
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { month: queryMonth, year: queryYear } = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const selectedMonth = Number(queryMonth ?? new Date().getMonth() + 1)
  const selectedYear = Number(queryYear ?? new Date().getFullYear())

  const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1)
  startOfMonth.setHours(0, 0, 0, 0)
  const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999)

  const [{ data: classesRaw }, { data: tournamentsRaw }, { data: studentsRaw }, { data: clubsRaw }] = await Promise.all([
    supabase
      .from('classes')
      .select(`
      id,
      scheduled_at,
      duration_minutes,
      status,
      price_cents,
      club:clubs(name),
      students:class_students(
        paid,
        paid_amount,
        student:students(full_name)
      )
    `)
      .gte('scheduled_at', startOfMonth.toISOString())
      .lte('scheduled_at', endOfMonth.toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('tournaments')
      .select(`
    id, name, start_date, end_date, status,
    students:tournament_students(payment_status, category_id,
      category:tournament_categories(price_cents)
    )
  `)
      .lte('start_date', endOfMonth.toISOString().split('T')[0])
      .gte('end_date', startOfMonth.toISOString().split('T')[0]),
    supabase.from('students').select('id, full_name').order('full_name'),
    supabase.from('clubs').select('id, name').order('name'),
  ])

  const studentsList = (studentsRaw ?? []) as Array<{ id: string; full_name: string }>
  const clubsList = (clubsRaw ?? []) as Array<{ id: string; name: string }>

  const classesByDay: Record<string, CalendarClassChip[]> = {}

  for (const row of classesRaw ?? []) {
    const c = row as any
    const start = new Date(c.scheduled_at)
    const end = new Date(start.getTime() + (Number(c.duration_minutes) || 0) * 60 * 1000)
    const key = dayKeyLocal(start)
    const clubFull = c.club?.name ?? 'Sede'
    const students = Array.isArray(c.students) ? c.students : []
    const studentNames = students.map((s: any) => s.student?.full_name).filter(Boolean) as string[]
    const totalCobradoCents = students.reduce((acc: number, s: any) => {
      if (!s?.paid || !s?.paid_amount) return acc
      return acc + Number(s.paid_amount ?? 0)
    }, 0)

    const chip: CalendarClassChip = {
      id: c.id,
      scheduledAt: c.scheduled_at,
      timeShort: start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      timeRangeLabel: `${start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
      dateLabel: start.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      clubAbbrev: abbrevClub(clubFull),
      clubFull,
      status: String(c.status ?? 'scheduled'),
      studentNames,
      totalCobradoCents,
    }

    if (!classesByDay[key]) classesByDay[key] = []
    classesByDay[key].push(chip)
  }

  for (const t of tournamentsRaw ?? []) {
    const tor = t as any
    const start = new Date(tor.start_date)
    const end = new Date(tor.end_date)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = dayKeyLocal(new Date(d))
      if (key < dayKeyLocal(startOfMonth) || key > dayKeyLocal(endOfMonth)) continue
      const chip: CalendarClassChip = {
        id: `torneo-${tor.id}-${key}`,
        scheduledAt: new Date(d).toISOString(),
        timeShort: '🏆',
        timeRangeLabel: String(tor.name ?? 'Evento'),
        dateLabel: new Date(d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        clubAbbrev: '🏆',
        clubFull: String(tor.name ?? 'Evento'),
        status: ({ 'upcoming': 'Próximo', 'in_progress': 'En curso', 'finished': 'Finalizado' } as Record<string, string>)[String(tor.status)] ?? String(tor.status),
        studentNames: Array((tor.students ?? []).length).fill("inscripto"),
        totalCobradoCents: (tor.students ?? [])
          .filter((s: any) => s?.payment_status === 'paid')
          .reduce((acc: number, s: any) => acc + (s?.category?.price_cents || 0), 0),
      }
      if (!classesByDay[key]) classesByDay[key] = []
      classesByDay[key].push(chip)
    }
  }

  for (const k of Object.keys(classesByDay)) {
    classesByDay[k].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8 font-sans selection:bg-[#bdfd2c] selection:text-slate-950 overflow-x-hidden max-w-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 bg-[var(--color-bg-card-inner)] border border-black/10 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Volver al dashboard"
            >
              ← Volver
            </Link>
            <Link
              href="/dashboard/contactos?status=student"
              className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-black/10 p-3 rounded-2xl text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Contactos"
            >
              <span aria-hidden className="text-base leading-none">👥</span>
            </Link>
            <Link
              href="/dashboard/caja"
              className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-black/10 p-3 rounded-2xl text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Caja"
            >
              <span aria-hidden className="text-base leading-none">💰</span>
            </Link>
            <Link
              href="/dashboard/torneos"
              className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-black/10 p-3 rounded-2xl text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Torneos y cancha abierta"
            >
              <span aria-hidden className="text-base leading-none">🏆</span>
            </Link>
            <h1 className="flex-1 text-center text-2xl md:text-3xl font-black tracking-tighter text-[var(--color-text-heading)] uppercase italic">
              Calendario
            </h1>
          </div>
          <div className="shrink-0">
            <MonthSelector currentMonth={selectedMonth} currentYear={selectedYear} />
          </div>
        </header>

        <CalendarMonthGrid
          year={selectedYear}
          month={selectedMonth}
          classesByDay={classesByDay}
          students={studentsList}
          clubs={clubsList}
        />
      </div>
    </div>
  )
}
