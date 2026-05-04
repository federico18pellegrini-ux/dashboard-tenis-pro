import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentMonthAR } from '@/lib/utils/calendar'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { AddExpenseModal } from '@/components/dashboard/AddExpenseModal'
import { deleteExpense } from '../actions'

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

  // Fetch de Ingresos, Clubes y Gastos detallados (Tarea 2)
  const [clubsRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from('clubs').select('*'),
    supabase.from('payments').select('*, students(club_id)').gte('payment_date', firstDayOfMonth).lte('payment_date', lastDayOfMonth),
    supabase.from('expenses').select('*, clubs(name)').gte('expense_date', firstDayOfMonth).lte('expense_date', lastDayOfMonth).order('expense_date', { ascending: false })
  ])

  const clubs = clubsRes.data || []
  const payments = paymentsRes.data || []
  const expenses = expensesRes.data || []

  // Totales Globales
  const totalIncomes = payments.reduce((acc, p) => acc + p.amount_cents, 0) / 100
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount_cents, 0) / 100
  const netMargin = totalIncomes - totalExpenses
  const marginPercentage = totalIncomes > 0 ? ((netMargin / totalIncomes) * 100).toFixed(1) : "0.0"

  // Rentabilidad por Sede
  const clubPnl = clubs.map(c => {
    const clubIncomes = payments.filter(p => p.students?.club_id === c.id).reduce((acc, p) => acc + p.amount_cents, 0) / 100
    const clubExpenses = expenses.filter(e => e.club_id === c.id).reduce((acc, e) => acc + e.amount_cents, 0) / 100
    const clubNet = clubIncomes - clubExpenses
    const clubMargin = clubIncomes > 0 ? ((clubNet / clubIncomes) * 100).toFixed(1) : "0.0"
    return { name: c.name, incomes: clubIncomes, expenses: clubExpenses, net: clubNet, margin: clubMargin }
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans selection:bg-[#bdfd2c] selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER (Tarea 1: Consistencia en navegación y nuevo título) */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <Link 
              href="/dashboard" 
              className="group bg-slate-900 border border-slate-800 p-3 rounded-2xl hover:border-[#bdfd2c] transition-all shadow-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 group-hover:text-[#bdfd2c] transition-colors">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </Link>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-[#bdfd2c] uppercase italic leading-none">Caja del Mes</h1>
              <div className="mt-2">
                <MonthSelector currentMonth={month} currentYear={year} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <AddExpenseModal clubs={clubs} />
          </div>
        </header>

        {/* KPIs GLOBALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.25em] mb-3">Ingresos Operativos</p>
            <p className="text-4xl font-black text-white italic tracking-tighter">${totalIncomes.toLocaleString('es-AR')}</p>
          </div>
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em] mb-3">Costos y Gastos</p>
            <p className="text-4xl font-black text-white italic tracking-tighter">${totalExpenses.toLocaleString('es-AR')}</p>
          </div>
          <div className={`p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group ${netMargin >= 0 ? 'bg-slate-900 border-2 border-[#bdfd2c]/20 shadow-[0_0_40px_rgba(189,253,44,0.05)]' : 'bg-slate-900 border-2 border-rose-500/20'}`}>
            <div className="flex justify-between items-start relative z-10">
              <p className={`text-[10px] font-black uppercase tracking-[0.25em] mb-3 ${netMargin >= 0 ? 'text-[#bdfd2c]' : 'text-rose-500'}`}>Margen Neto</p>
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg shadow-xl ${netMargin >= 0 ? 'bg-[#bdfd2c] text-slate-950' : 'bg-rose-500 text-white'}`}>{marginPercentage}%</span>
            </div>
            <p className={`text-4xl font-black mt-1 italic tracking-tighter ${netMargin >= 0 ? 'text-[#bdfd2c]' : 'text-rose-500'}`}>${netMargin.toLocaleString('es-AR')}</p>
          </div>
        </div>

        {/* BREAKDOWN POR SEDE */}
        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-8">
          <h2 className="text-xs font-black text-white uppercase tracking-[0.15em] italic border-b border-slate-800 pb-5 mb-8">Estado de Resultados por Sede</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clubPnl.map(club => (
              <div key={club.name} className="bg-slate-950 p-6 rounded-3xl border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4">{club.name}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold uppercase">Ingresos</span>
                      <span className="text-emerald-400 font-black">${club.incomes.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold uppercase">Gastos</span>
                      <span className="text-rose-400 font-black">-${club.expenses.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neto</span>
                  <span className={`text-xl font-black italic tracking-tighter ${club.net >= 0 ? 'text-[#bdfd2c]' : 'text-rose-400'}`}>${club.net.toLocaleString('es-AR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAREA 2: DETALLE DE GASTOS CARGADOS (Auditabilidad) */}
        <section className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.15em] italic">Detalle de Gastos</h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{expenses.length} MOVIMIENTOS</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950/40 border-b border-slate-800">
                  <th className="px-8 py-4">Fecha</th>
                  <th className="px-8 py-4">Descripción</th>
                  <th className="px-8 py-4">Categoría</th>
                  <th className="px-8 py-4">Sede</th>
                  <th className="px-8 py-4">Monto</th>
                  <th className="px-8 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {expenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">
                      {new Date(exp.expense_date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-8 py-4 text-xs">
                      <p className="font-black text-slate-100 uppercase tracking-tight">{exp.description}</p>
                      {exp.paid_to && (
                        <p className="text-[9px] text-slate-500 uppercase mt-1">
                          A: {exp.paid_to} • {exp.payment_method}
                        </p>
                      )}
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-[9px] font-black bg-slate-950 text-rose-400 px-2.5 py-1 rounded-lg border border-rose-500/20 uppercase tracking-tighter">
                        {exp.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">
                      {exp.clubs?.name || 'Global'}
                    </td>
                    <td className="px-8 py-4 text-sm font-black text-white italic tracking-tighter">
                      -${(exp.amount_cents / 100).toLocaleString('es-AR')}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <form action={async () => { 'use server'; await deleteExpense(exp.id) }}>
                        <button type="submit" className="text-slate-700 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-500/10">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {expenses.length === 0 && (
            <div className="p-20 text-center opacity-20">
              <p className="text-xs font-black uppercase tracking-[0.3em]">Sin gastos registrados este mes</p>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}