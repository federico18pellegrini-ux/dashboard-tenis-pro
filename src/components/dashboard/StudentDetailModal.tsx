'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { updateRecurringSchedule } from '@/app/dashboard/actions'
import { useRouter } from 'next/navigation'

interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  club_id: string
  clubs: { name: string } | null
}

interface StudentProps {
  id: string
  full_name: string
  phone: string
  price_per_class_cents: number
  schedules: Schedule[]
}

export function StudentDetailModal({ 
  student, 
  isOpen, 
  onClose 
}: { 
  student: StudentProps, 
  isOpen: boolean, 
  onClose: () => void 
}) {
  const [mounted, setMounted] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  async function handleUpdate(formData: FormData, scheduleId: string) {
    setIsSubmitting(true)
    const priceCents = Math.round(parseFloat(formData.get('price') as string) * 100)
    
    const result = await updateRecurringSchedule(scheduleId, {
      day_of_week: parseInt(formData.get('day_of_week') as string),
      start_time: formData.get('start_time') as string,
      duration_minutes: parseInt(formData.get('duration') as string),
      price_per_class_cents: priceCents
    })

    if (result.success) {
      setEditingScheduleId(null)
      router.refresh() // Actualiza los datos en el servidor sin cerrar el modal
    } else {
      alert(`Error: ${result.error}`)
    }
    setIsSubmitting(false)
  }

  if (!isOpen || !mounted) return null

  const inputClasses = "w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-[#bdfd2c] transition-all"
  const labelClasses = "text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 ml-1"

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-950 border border-[#bdfd2c]/30 flex items-center justify-center font-black text-[#bdfd2c] text-xl italic">
              {student.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2 italic">
                {student.full_name}
              </h2>
              <p className="text-xs text-slate-500 font-bold tracking-[0.15em]">
                +{student.phone}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-600 hover:text-rose-500 transition-colors p-2 bg-slate-950 rounded-xl border border-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* AGENDA SETTINGS */}
        <div className="space-y-5 overflow-y-auto max-h-[50vh] pr-2 custom-scrollbar">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">Agenda Recurrente</h3>
          
          {student.schedules.map(sched => {
            const isEditing = editingScheduleId === sched.id

            if (isEditing) {
              return (
                <form 
                  key={sched.id} 
                  action={(fd) => handleUpdate(fd, sched.id)} 
                  className="bg-slate-950 p-6 rounded-[2rem] border border-[#bdfd2c]/40 space-y-5 animate-in slide-in-from-top-2"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Día</label>
                      <select name="day_of_week" defaultValue={sched.day_of_week} className={inputClasses}>
                        {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>Inicio</label>
                      <input type="time" name="start_time" defaultValue={sched.start_time.slice(0, 5)} required className={inputClasses} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Minutos</label>
                      <input type="number" name="duration" defaultValue={60} step={30} required className={inputClasses} />
                    </div>
                    <div>
                      <label className={labelClasses}>Precio ($)</label>
                      <input type="number" name="price" defaultValue={student.price_per_class_cents / 100} required className={inputClasses} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingScheduleId(null)} 
                      className="flex-1 bg-slate-900 border border-slate-800 text-slate-500 py-3 rounded-xl text-[10px] font-black uppercase transition-all"
                    >
                      Cerrar
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="flex-1 bg-[#bdfd2c] text-slate-950 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? '...' : 'OK'}
                    </button>
                  </div>
                </form>
              )
            }

            return (
              <div 
                key={sched.id} 
                className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/60 flex justify-between items-center group"
              >
                <div>
                  <p className="text-sm font-black text-slate-100 italic uppercase">
                    {days[sched.day_of_week]} <span className="text-[#bdfd2c] ml-1">{sched.start_time.slice(0, 5)}hs</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {sched.clubs?.name || 'Sede'} • ${(student.price_per_class_cents / 100).toLocaleString('es-AR')}
                  </p>
                </div>
                <button 
                  onClick={() => setEditingScheduleId(sched.id)} 
                  className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-500 hover:text-[#bdfd2c] transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}