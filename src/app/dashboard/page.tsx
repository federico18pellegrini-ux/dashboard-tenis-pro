import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PaymentButton } from '@/components/dashboard/PaymentButton'
import { deletePayment, deleteStudent } from './actions'
import { countWeekdaysInMonth, getCurrentMonthAR } from '@/lib/utils/calendar'
import { AddStudentModal } from '@/components/dashboard/AddStudentModal'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { whatsappLink } from '@/lib/whatsapp/links'
import { StudentNameLink } from '@/components/dashboard/StudentNameLink' // Importación del nuevo componente

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
  
  const weekdayCounts = countWeekdaysInMonth(year, month - 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  
  const isCurrentMonth = month === now.month + 1 && year === now.year
  const currentDay = isCurrentMonth ? new Date().getDate() : daysInMonth
  const monthProgress = (currentDay / daysInMonth) * 100
  const currentDayOfWeek = new Date().getDay()

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const currentMonthName = monthNames[month - 1];

  // --- FETCH DE DATOS ---
  const [studentsRes, schedulesRes, clubsRes, paymentsRes] = await Promise.all([
    supabase.from('students').select('*, clubs(name)'),
    supabase.from('schedules').select(`
      *, 
      students(id, full_name, phone, level, price_per_class_cents, club_id, active),
      clubs(name)
    `),
    supabase.from('clubs').select('*'),
    supabase.from('payments').select('*')
      .gte('payment_date', firstDayOfMonth)
      .lte('payment_date', lastDayOfMonth)
  ])

  const schedules = schedulesRes.data || []
  const clubs = clubsRes.data || []
  const payments = paymentsRes.data || []

  // --- CÁLCULOS FINANCIEROS ---
  const clubPerformance = clubs.map(c => {
    const clubSchedules = schedules.filter(s => s.club_id === c.id)
    const projectedCents = clubSchedules.reduce((acc, s) => acc + ((s.students?.price_per_class_cents || 0) * weekdayCounts[s.day_of_week]), 0)
    const clubStudentIds = new Set(clubSchedules.map(s => s.student_id))
    const paidCents = payments.filter(p => clubStudentIds.has(p.student_id)).reduce((acc, p) => acc + p.amount_cents, 0)

    return {
      name: c.name,
      paid: paidCents / 100,
      efficiency: projectedCents > 0 ? ((paidCents / projectedCents) * 100).toFixed(1) : "0.0"
    }
  })

  const currentClubId = clubs.find(c => c.name === club)?.id
  const filteredSchedules = currentClubId ? schedules.filter(s => s.club_id === currentClubId) : schedules
  
  const totalProjectedCents = filteredSchedules.reduce((acc, s) => acc + ((s.students?.price_per_class_cents || 0) * weekdayCounts[s.day_of_week]), 0)
  const totalPaidCents = payments.filter(p => !currentClubId || filteredSchedules.some(s => s.student_id === p.student_id)).reduce((acc, p) => acc + p.amount_cents, 0)
  const efficiency = totalProjectedCents > 0 ? ((totalPaidCents / totalProjectedCents) * 100).toFixed(1) : "0.0"

  const debtorIds = new Set(filteredSchedules.filter(s => !payments.some(p => p.student_id === s.student_id)).map(s => s.student_id))
  const debtors = studentsRes.data?.filter(st => debtorIds.has(st.id)) || []

  const days = [
    { name: 'Lunes', idx: 1 }, { name: 'Martes', idx: 2 }, { name: 'Miércoles', idx: 3 },
    { name: 'Jueves', idx: 4 }, { name: 'Viernes', idx: 5 }, { name: 'Sábado', idx: 6 }, { name: 'Domingo', idx: 0 }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans selection:bg-[#bdfd2c] selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black tracking-tighter text-[#bdfd2c] uppercase italic leading-none">
                Padel Sartori Control
              </h1>
              <div className="flex items-center gap-4 mt-3">
                <MonthSelector currentMonth={month} currentYear={year} />
                <nav className="flex items-center gap-3 border-l border-slate-800 pl-4 ml-2">
                   <Link href="/dashboard/contactos" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#bdfd2c] transition-colors">
                     Contactos
                   </Link>
                   <Link href="/dashboard/caja" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#bdfd2c] transition-colors">
                     Caja
                   </Link>
                </nav>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4 w-full md:w-auto">
              <div className="flex gap-3">
                <AddStudentModal clubs={clubs} />
              </div>
              
              <div className="bg-slate-900 px-5 py-4 rounded-[1.5rem] border border-slate-800 shadow-2xl flex flex-col items-end w-full max-w-[280px]">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Progreso del Mes</span>
                <div className="flex items-center gap-3 w-full justify-end">
                  <div className="w-32 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-[#bdfd2c] shadow-[0_0_12px_#bdfd2c] rounded-full transition-all duration-1000" style={{ width: `${monthProgress}%` }} />
                  </div>
                  <span className="text-xs font-black text-slate-300 whitespace-nowrap">Día {currentDay}/{daysInMonth}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3">Meta Proyectada</p>
              <p className="text-4xl font-black text-white italic tracking-tighter">${(totalProjectedCents / 100).toLocaleString('es-AR')}</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] border-2 border-[#bdfd2c]/20 shadow-[0_0_40px_rgba(189,253,44,0.05)] relative overflow-hidden group">
              <div className="flex justify-between items-start relative z-10">
                <p className="text-[10px] font-black text-[#bdfd2c] uppercase tracking-[0.25em] mb-3">Recaudación Real</p>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black bg-[#bdfd2c] text-slate-950 px-2.5 py-1 rounded-lg shadow-xl mb-1">{efficiency}%</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">vs {monthProgress.toFixed(1)}% tiempo</span>
                </div>
              </div>
              <p className="text-4xl font-black text-[#bdfd2c] mt-1 italic tracking-tighter">${(totalPaidCents / 100).toLocaleString('es-AR')}</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.25em] mb-3">Capital Pendiente</p>
              <p className="text-4xl font-black text-white italic tracking-tighter">${((totalProjectedCents - totalPaidCents) / 100).toLocaleString('es-AR')}</p>
            </div>
          </div>
        </header>

        {/* SECCIÓN CENTRAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[450px]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h2 className="text-xs font-black text-white uppercase tracking-[0.15em] italic">Deuda Vencida</h2>
              <span className="text-[10px] font-black bg-slate-950 border border-slate-800 text-[#bdfd2c] px-4 py-2 rounded-xl uppercase tracking-widest">{debtors.length} PENDIENTES</span>
            </div>
            <div className="divide-y divide-slate-800/50 overflow-y-auto custom-scrollbar">
              {debtors.map((debtor) => {
                const formattedPrice = new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                  maximumFractionDigits: 0
                }).format(debtor.price_per_class_cents / 100);

                const waMessage = `Hola ${debtor.full_name.split(' ')[0]}! Te recuerdo que tenés pendiente la mensualidad de ${currentMonthName} (${formattedPrice}). ¿Me confirmás el pago cuando puedas? Gracias 🎾`;
                const waHref = whatsappLink(debtor.phone, waMessage);

                return (
                  <div key={debtor.id} className="p-6 flex items-center justify-between hover:bg-slate-800/40 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 font-black text-sm group-hover:border-[#bdfd2c] transition-all">
                        {debtor.full_name.split(' ').map((n: any) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-100 uppercase tracking-tight mb-1 leading-none">{debtor.full_name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
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

          <section className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-8 flex flex-col h-[450px]">
            <h2 className="text-xs font-black text-white uppercase tracking-[0.15em] italic border-b border-slate-800 pb-5 mb-8">Performance por Sede</h2>
            <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
              {clubPerformance.map(cp => (
                <div key={cp.name} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{cp.name}</p>
                      <p className="text-2xl font-black text-white italic tracking-tighter">${cp.paid.toLocaleString('es-AR')}</p>
                    </div>
                    <p className="text-[10px] font-black text-[#bdfd2c] bg-[#bdfd2c]/10 border border-[#bdfd2c]/30 px-3 py-1.5 rounded-xl uppercase">{cp.efficiency}%</p>
                  </div>
                  <div className="h-2.5 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner">
                    <div className="h-full bg-[#bdfd2c] shadow-[0_0_15px_#bdfd2c] rounded-full transition-all duration-1000" style={{ width: `${cp.efficiency}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* TABS DE SEDES */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-slate-800/60">
          <Link href="/dashboard" className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${!club ? 'bg-[#bdfd2c] text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>
            TODAS LAS SEDES
          </Link>
          {clubs.map((c) => (
            <Link key={c.id} href={`/dashboard?club=${encodeURIComponent(c.name)}`} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all ${club === c.name ? 'bg-[#bdfd2c] text-slate-950 shadow-lg' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}>
              {c.name}
            </Link>
          ))}
        </div>

        {/* GRILLA SEMANAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-5 pb-20">
          {days.map((day) => {
            const rawClassesForDay = filteredSchedules.filter(s => s.day_of_week === day.idx)
            const classesForDay = rawClassesForDay.sort((a, b) => a.start_time.localeCompare(b.start_time))
            const isToday = currentDayOfWeek === day.idx && isCurrentMonth

            return (
              <div key={day.name} className={`space-y-5 p-4 rounded-[2.5rem] transition-all border ${isToday ? 'bg-slate-900 border-[#bdfd2c]/40 shadow-[0_0_50px_rgba(189,253,44,0.08)] ring-1 ring-[#bdfd2c]/10' : 'bg-slate-900/40 border-slate-800/60'}`}>
                <h3 className={`text-[10px] font-black uppercase tracking-[0.25em] pb-4 border-b flex justify-between items-center ${isToday ? 'text-[#bdfd2c] border-[#bdfd2c]/20' : 'text-slate-600 border-slate-800/80'}`}>
                  <span>{day.name}</span>
                  {isToday && <span className="bg-[#bdfd2c] text-slate-950 px-2 py-0.5 rounded-lg text-[8px] italic font-black">HOY</span>}
                </h3>
                
                <div className="space-y-4">
                  {classesForDay.map((cls: any) => {
                    const hasPaid = payments.some(p => p.student_id === cls.student_id)
                    return (
                      <div key={cls.id} className={`p-5 rounded-[1.5rem] border transition-all ${hasPaid ? 'bg-emerald-950/20 border-emerald-900/40 shadow-inner' : 'bg-slate-950 border-slate-800 group hover:border-slate-700 shadow-xl'}`}>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[9px] font-black text-slate-500 tracking-[0.15em] uppercase">{cls.start_time.slice(0, 5)} HS</span>
                          <form action={async () => { 'use server'; await deleteStudent(cls.student_id) }}>
                            <button type="submit" className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-rose-500 transition-all p-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          </form>
                        </div>
                        
                        {/* 🚀 CAMBIO CLAVE: Usamos el nuevo Link interactivo[cite: 2] */}
                        <StudentNameLink 
                          student={cls.students} 
                          clubs={clubs} 
                        />
                        
                        <div className="flex justify-center">
                          {!hasPaid ? (
                            <PaymentButton studentId={cls.student_id} amount={cls.students?.price_per_class_cents || 0} studentName={cls.students?.full_name || ''} />
                          ) : (
                            <div className="flex items-center gap-2 bg-emerald-900/30 px-4 py-2 rounded-xl border border-emerald-800/50 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                              <span className="text-[8px] text-emerald-400 font-black uppercase italic tracking-widest">Pago OK</span>
                              <form action={async () => { 'use server'; await deletePayment(cls.student_id) }}>
                                <button type="submit" className="text-emerald-800 hover:text-rose-500 transition-colors">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}