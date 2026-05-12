import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { AddExpenseModal } from '@/components/dashboard/AddExpenseModal'
import { getCurrentMonthAR } from '@/lib/utils/calendar'
import { CajaClassPaymentsSection } from '@/components/dashboard/CajaClassPaymentsSection'
import { CajaExpensesSection } from '@/components/dashboard/CajaExpensesSection'

function paymentMethodLabel(method: string | null) {
  if (!method) return '—'
  if (method === 'cash') return 'Efectivo'
  if (method === 'transfer') return 'Transferencia'
  if (method === 'mp') return 'Mercado Pago'
  return method
}

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString('es-AR')
}

function monthLabelEsAR(month1to12: number, year: number) {
  const d = new Date(year, month1to12 - 1, 1)
  const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default async function CajaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { month: queryMonth, year: queryYear } = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = getCurrentMonthAR()
  const month = queryMonth ? parseInt(queryMonth) : now.month + 1
  const year = queryYear ? parseInt(queryYear) : now.year

  const firstDayOfMonth = new Date(year, month - 1, 1).toISOString()
  const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString()
  const startOfMonth = new Date(year, month - 1, 1)
  startOfMonth.setHours(0, 0, 0, 0)
  const endOfMonth = new Date(year, month, 0)
  endOfMonth.setHours(23, 59, 59, 999)

  const [clubsRes, expensesRes, classPaymentsRes, tournamentPaymentsRes] = await Promise.all([
    supabase.from('clubs').select('*'),
    supabase.from('expenses').select('*, clubs(name)').gte('expense_date', firstDayOfMonth).lte('expense_date', lastDayOfMonth).order('expense_date', { ascending: false }),
    supabase
      .from('class_students')
      .select(`
        class_id,
        student_id,
        paid_amount,
        paid_at,
        payment_method,
        student:students(full_name),
        class:classes(
          club_id,
          scheduled_at
        )
      `)
      .eq('paid', true)
      .not('paid_at', 'is', null)
      .gte('paid_at', startOfMonth.toISOString())
      .lte('paid_at', endOfMonth.toISOString()),
    supabase
      .from('payments')
      .select('id, student_id, amount_cents, payment_date, payment_method, notes, paid_at, student:students(full_name)')
      .eq('type', 'tournament')
      .gte('payment_date', firstDayOfMonth)
      .lte('payment_date', lastDayOfMonth)
      .order('payment_date', { ascending: false }),
  ])

  const clubs = clubsRes.data || []
  const expenses = expensesRes.data || []
  const classPayments = classPaymentsRes.data || []
  const tournamentPayments = tournamentPaymentsRes.data || []

  const clubById = new Map<string, { id: string; name: string }>(clubs.map((c: any) => [c.id, { id: c.id, name: c.name }]))

  const tournamentIncomesCents = tournamentPayments.reduce((acc: number, p: any) => acc + (p.amount_cents || 0), 0)
  const tournamentExpensesCents = expenses
    .filter((e: any) => String(e?.category ?? '').startsWith('torneo_'))
    .reduce((acc: number, e: any) => acc + (e.amount_cents || 0), 0)

  const tournamentNetCents = tournamentIncomesCents - tournamentExpensesCents
  const totalIncomesCents = classPayments.reduce((acc: number, p: any) => acc + (p.paid_amount || 0), 0) + tournamentPayments.reduce((acc: number, p: any) => acc + (p.amount_cents || 0), 0)
  const totalExpensesCents = expenses.reduce((acc: number, e: any) => acc + (e.amount_cents || 0), 0)
  const netCents = totalIncomesCents - totalExpensesCents

  const perClub = clubs.map((c: any) => {
    const incomesCents = classPayments
      .filter((p: any) => p.class?.club_id === c.id)
      .reduce((acc: number, p: any) => acc + (p.paid_amount || 0), 0)

    const expensesCents = expenses.filter((e: any) => e.club_id === c.id).reduce((acc: number, e: any) => acc + (e.amount_cents || 0), 0)
    const net = incomesCents - expensesCents
    return {
      clubName: c.name as string,
      incomesCents,
      expensesCents,
      netCents: net,
    }
  })

  const classPaymentsRows = classPayments.map((p: any) => {
    const clubName = p.class?.club_id ? (clubById.get(p.class.club_id)?.name ?? 'Global') : 'Global'
    return {
      id: p.class_id as string,
      student_id: p.student_id as string,
      paid_at: (p.paid_at as string | null) ?? null,
      student_name: (p.student?.full_name as string | undefined) ?? 'Alumno',
      method_label: paymentMethodLabel((p.payment_method as string | null) ?? null),
      club_name: clubName,
      amount_cents: Number(p.paid_amount || 0),
    }
  })

  const tournamentPaymentsRows = tournamentPayments.map((p: any) => ({
    id: p.id as string,
    student_id: p.student_id as string,
    paid_at: (p.paid_at as string | null) ?? (p.payment_date as string | null) ?? null,
    student_name: (p.student?.full_name as string | undefined) ?? 'Alumno',
    method_label: paymentMethodLabel((p.payment_method as string | null) ?? null),
    club_name: (p.notes as string | null)?.replace('TORNEO — ', '').split(' · ')[0] ?? 'Torneo',
    amount_cents: Number(p.amount_cents || 0),
  }))

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8 font-sans selection:bg-[#bdfd2c] selection:text-slate-950 overflow-x-hidden max-w-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 bg-[var(--color-bg-card-inner)] border border-black/10 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Volver al dashboard"
            >
              ← Volver
            </Link>
            <Link
              href="/dashboard/contactos"
              className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-black/10 p-3 rounded-2xl text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Contactos"
            >
              <span aria-hidden className="text-base leading-none">👥</span>
            </Link>
            <Link
              href={`/dashboard/calendario?month=${month}&year=${year}`}
              className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-black/10 p-3 rounded-2xl text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Calendario"
            >
              <span aria-hidden className="text-base leading-none">📅</span>
            </Link>
            <Link
              href="/dashboard/torneos"
              className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-black/10 p-3 rounded-2xl text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
              aria-label="Torneos"
            >
              <span aria-hidden className="text-base leading-none">🏆</span>
            </Link>
            <h1 className="flex-1 text-center text-2xl md:text-3xl font-black tracking-tighter text-[var(--color-text-heading)] uppercase italic">
              Caja
            </h1>
          </div>

          <div className="flex w-full items-center gap-2">
            <div className="min-w-0 flex-1">
              <MonthSelector currentMonth={month} currentYear={year} pathname="/dashboard/caja" />
            </div>
            <div className="shrink-0 flex items-center [&_button]:whitespace-nowrap">
              <AddExpenseModal clubs={clubs} />
            </div>
          </div>
        </header>

        {/* Bloque 1 — 3 números grandes */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] rounded-[2.5rem] border border-black/10  shadow-2xl p-6 md:p-8">
            <p className="text-[10px] font-black text-[var(--color-success)] dark:text-emerald-400 uppercase tracking-[0.25em] mb-3">Cobrado</p>
            <p className="text-4xl md:text-5xl font-black text-[var(--color-success)] dark:text-emerald-300 italic tracking-tighter">${formatMoney(totalIncomesCents)}</p>
          </div>
          <div className="bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] rounded-[2.5rem] border border-black/10  shadow-2xl p-6 md:p-8">
            <p className="text-[10px] font-black text-red-600 dark:text-rose-400 uppercase tracking-[0.25em] mb-3">Gastado</p>
            <p className="text-4xl md:text-5xl font-black text-red-600 dark:text-rose-300 italic tracking-tighter">-${formatMoney(totalExpensesCents)}</p>
          </div>
          <div className="bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] rounded-[2.5rem] border border-black/10  shadow-2xl p-6 md:p-8">
            <p className="text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-[0.25em] mb-3">Ganancia</p>
            <p className={`text-4xl md:text-5xl font-black italic tracking-tighter ${netCents >= 0 ? 'text-[var(--color-accent)] dark:text-[var(--color-accent)]' : 'text-red-600 dark:text-rose-300'}`}>
              {netCents >= 0 ? '$' : '-$'}
              {formatMoney(Math.abs(netCents))}
            </p>
          </div>
        </section>

        {/* Bloque 2 — Por sede */}
        <section className="bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] rounded-[2.5rem] border border-black/10  shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8 border-b border-black/10  bg-[var(--color-bg-card-inner)]/80 bg-[var(--color-bg-page)]/20">
            <h2 className="text-sm md:text-xs font-black text-[var(--color-text-body)]  uppercase tracking-[0.15em] italic">Por sede — {monthLabelEsAR(month, year)}</h2>
          </div>
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {perClub.map((c) => (
              <div key={c.clubName} className="bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-page)] rounded-3xl border border-black/10  p-5 md:p-6 shadow-xl">
                <h3 className="text-xs font-black text-[var(--color-text-body)] text-[var(--color-text-body)] uppercase tracking-widest mb-4">{c.clubName}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold uppercase">Cobrado</span>
                    <span className="text-[var(--color-success)] dark:text-emerald-300 font-black">${formatMoney(c.incomesCents)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold uppercase">Gastado</span>
                    <span className="text-red-600 dark:text-rose-300 font-black">-${formatMoney(c.expensesCents)}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-black/10  flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold uppercase">Ganancia</span>
                    <span className={`font-black ${c.netCents >= 0 ? 'text-[var(--color-accent)] dark:text-[var(--color-accent)]' : 'text-red-600 dark:text-rose-300'}`}>
                      {c.netCents >= 0 ? '$' : '-$'}
                      {formatMoney(Math.abs(c.netCents))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-page)] rounded-3xl border border-black/10 p-5 md:p-6 shadow-xl">
              <h3 className="text-xs font-black text-[var(--color-text-body)] uppercase tracking-widest mb-4">Torneos</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-[var(--color-text-muted)] uppercase tracking-widest">Cobrado</span>
                  <span className="font-black text-[var(--color-success)]">${formatMoney(tournamentIncomesCents)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-[var(--color-text-muted)] uppercase tracking-widest">Gastado</span>
                  <span className="font-black text-red-600">-${formatMoney(tournamentExpensesCents)}</span>
                </div>
                <div className="border-t border-black/10 pt-2 flex justify-between items-center text-xs">
                  <span className="font-black text-[var(--color-text-muted)] uppercase tracking-widest">Ganancia</span>
                  <span className={`font-black ${tournamentNetCents >= 0 ? 'text-[var(--color-accent)]' : 'text-red-600'}`}>
                    {tournamentNetCents >= 0 ? '$' : '-$'}{formatMoney(Math.abs(tournamentNetCents))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bloque 3 — Ingresos por clases */}
        <CajaClassPaymentsSection title="Ingresos por clases" rows={classPaymentsRows} kind="class" />
        <CajaClassPaymentsSection title="Ingresos por torneos" rows={tournamentPaymentsRows} kind="tournament" />

        {/* Bloque 4 — Detalle de gastos */}
        <CajaExpensesSection expenses={expenses} />

      </div>
    </div>
  )
}