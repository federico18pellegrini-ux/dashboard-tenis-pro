'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { addManualStudent } from '@/app/dashboard/actions'

interface Club {
  id: string
  name: string
}

export function AddStudentModal({ clubs }: { clubs: Club[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estado para manejar múltiples días/horarios
  const [schedules, setSchedules] = useState([
    { club_id: clubs[0]?.id || '', day_of_week: 1, start_time: '10:00' }
  ])

  useEffect(() => { setMounted(true) }, [])

  const days = [
    { n: 'Lunes', v: 1 }, { n: 'Martes', v: 2 }, { n: 'Miércoles', v: 3 },
    { n: 'Jueves', v: 4 }, { n: 'Viernes', v: 5 }, { n: 'Sábado', v: 6 }, { n: 'Domingo', v: 0 }
  ]

  const addDayRow = () => {
    setSchedules([...schedules, { club_id: clubs[0]?.id || '', day_of_week: 1, start_time: '10:00' }])
  }

  const removeDayRow = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index))
    }
  }

  const updateSchedule = (index: number, field: string, value: any) => {
    const newSchedules = [...schedules]
    newSchedules[index] = { ...newSchedules[index], [field]: value }
    setSchedules(newSchedules)
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    
    // Validación del precio para evitar NaN
    const priceRaw = formData.get('price') as string
    const priceCents = priceRaw ? Math.round(parseFloat(priceRaw) * 100) : 0

    const result = await addManualStudent({
      full_name: formData.get('full_name') as string,
      phone: formData.get('phone') as string,
      level: formData.get('level') as string,
      price_per_class_cents: priceCents,
      schedules: schedules
    })

    if (result.success) {
      setIsOpen(false)
      setSchedules([{ club_id: clubs[0]?.id || '', day_of_week: 1, start_time: '10:00' }])
    } else {
      alert(`Error: ${result.error}`)
    }
    setIsSubmitting(false)
  }

  if (!mounted) return null

  const inputClasses = "w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-[#bdfd2c] transition-all"
  const labelClasses = "text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 ml-1"

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-[var(--color-accent-secondary)] hover:bg-green-800  dark:hover:bg-[#a5e620] text-white dark:text-slate-950 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(189,253,44,0.15)] flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Nuevo Alumno
      </button>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter mb-8 border-b border-slate-800 pb-4">Alta de Alumno</h2>
            
            <form action={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Nombre Completo</label>
                  <input name="full_name" required className={inputClasses} placeholder="Ej: Juan Perez" />
                </div>
                <div>
                  <label className={labelClasses}>Teléfono (WhatsApp)</label>
                  <input name="phone" required className={inputClasses} placeholder="54911..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Nivel</label>
                  <select name="level" className={inputClasses}>
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Precio x Clase ($)</label>
                  <input name="price" type="number" step="0.01" defaultValue="0" className={inputClasses} />
                </div>
              </div>

              {/* SECCIÓN DINÁMICA DE HORARIOS */}
              <div className="space-y-3 border-t border-slate-800/60 pt-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Agenda Semanal</h3>
                  <button type="button" onClick={addDayRow} className="text-[var(--color-text-heading)]  text-[9px] font-black uppercase tracking-widest hover:underline">+ Agregar Día</button>
                </div>

                <div className="max-h-[200px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {schedules.map((s, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-950 p-3 rounded-2xl border border-slate-800 group transition-all hover:border-slate-700">
                      <div className="col-span-5">
                        <select 
                          value={s.day_of_week} 
                          onChange={(e) => updateSchedule(index, 'day_of_week', parseInt(e.target.value))}
                          className="w-full bg-transparent text-[11px] font-bold text-white outline-none"
                        >
                          {days.map(d => <option key={d.v} value={d.v}>{d.n}</option>)}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="time" 
                          value={s.start_time}
                          onChange={(e) => updateSchedule(index, 'start_time', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-bold text-white outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <select 
                          value={s.club_id} 
                          onChange={(e) => updateSchedule(index, 'club_id', e.target.value)}
                          className="w-full bg-transparent text-[11px] font-bold text-[var(--color-text-heading)]  outline-none"
                        >
                          {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-1 text-right">
                        {schedules.length > 1 && (
                          <button type="button" onClick={() => removeDayRow(index)} className="text-slate-700 hover:text-rose-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-slate-800 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-[var(--color-accent-secondary)] hover:bg-green-800  dark:hover:bg-[#a5e620] text-white dark:text-slate-950 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'GUARDANDO...' : 'CONFIRMAR ALTA'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}