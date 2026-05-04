import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PromoteToStudentModal } from '@/components/contacts/PromoteToStudentModal'
import { AddContactModal } from '@/components/contacts/AddContactModal'
import { ContactActionsMenu } from '@/components/contacts/ContactActionsMenu'

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { status = 'unclassified', q = '' } = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Fetch de contactos con filtros aplicados
  let query = supabase.from('contacts').select('*')
  
  if (status !== 'all') {
    query = query.eq('status', status)
  }
  
  if (q) {
    query = query.ilike('full_name', `%${q}%`)
  }

  // FIX: Aseguramos que data sea un array vacío por defecto si falla el fetch
  const { data: contacts = [] } = await query.order('full_name')

  // 2. Fetch de sedes (Clubes)
  const { data: clubs = [] } = await supabase.from('clubs').select('*').order('name')

  // 3. Métricas para el Header
  const [totalRes, unclassifiedRes, studentsRes] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'unclassified'),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'student')
  ])

  const total = totalRes.count || 0
  const unclassified = unclassifiedRes.count || 0
  const studentsCount = studentsRes.count || 0

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans selection:bg-[#bdfd2c] selection:text-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
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
              <h1 className="text-4xl font-black tracking-tighter text-[#bdfd2c] uppercase italic leading-none">
                Contactos
              </h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3 leading-none">
                {total} TOTAL • {studentsCount} ALUMNOS • {unclassified} PENDIENTES
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <AddContactModal />
          </div>
        </header>

        {/* NAVEGACIÓN POR ESTADOS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-slate-800/60">
          {[
            { id: 'unclassified', label: 'Sin Clasificar' },
            { id: 'student', label: 'Alumnos' },
            { id: 'archived', label: 'Archivados' },
            { id: 'all', label: 'Todos' }
          ].map((tab) => (
            <Link
              key={tab.id}
              href={`/dashboard/contactos?status=${tab.id}`}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                status === tab.id 
                ? 'bg-[#bdfd2c] text-slate-950 shadow-[0_0_20px_rgba(189,253,44,0.2)]' 
                : 'bg-slate-900 text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* TABLA DE GESTIÓN */}
        <div className="bg-slate-900/30 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-950/40">
                  <th className="px-8 py-6">Contacto</th>
                  <th className="px-8 py-6">Etiquetas</th>
                  <th className="px-8 py-6">Estado</th>
                  <th className="px-8 py-6 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {/* FIX: Agregamos optional chaining (?.) para el build de Vercel */}
                {contacts?.map((contact) => (
                  <tr key={contact.id} className="group hover:bg-slate-800/10 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-slate-500 group-hover:border-[#bdfd2c] group-hover:text-[#bdfd2c] transition-all">
                          {contact.full_name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-100 uppercase tracking-tight leading-none mb-1.5 leading-none">{contact.full_name}</p>
                          <p className="text-xs text-slate-500 font-bold tracking-widest">+{contact.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {contact.tags?.map((tag: string) => (
                          <span key={tag} className="text-[9px] font-black bg-slate-950 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-800 uppercase tracking-tighter">
                            {tag}
                          </span>
                        )) || <span className="text-[10px] text-slate-600 italic font-bold">-</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl tracking-widest border uppercase ${
                        contact.status === 'student' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/50' :
                        contact.status === 'archived' ? 'bg-slate-950 text-slate-600 border-slate-800' :
                        'bg-[#bdfd2c]/10 text-[#bdfd2c] border-[#bdfd2c]/20 shadow-[0_0_10px_rgba(189,253,44,0.05)]'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end items-center gap-4">
                        {contact.status === 'unclassified' && (
                          <PromoteToStudentModal contact={contact} clubs={clubs || []} />
                        )}
                        <ContactActionsMenu contact={contact} clubs={clubs || []} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}