'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { updateStudentData } from '@/lib/actions/contacts'
import { useRouter } from 'next/navigation'

interface Schedule {
  day_of_week: number
  start_time: string
}

export function EditStudentModal({ 
  contact, 
  clubs = [], // Aseguramos un array vacío por defecto para evitar errores de .map
  onClose 
}: { 
  contact: any, 
  clubs: any[], 
  onClose: () => void 
}) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedClub, setSelectedClub] = useState(contact.club_id || '')
  const router = useRouter()
  
  const [schedules, setSchedules] = useState<Schedule[]>([{ day_of_week: 1, start_time: "10:00" }])

  useEffect(() => { 
    setMounted(true)
    if (contact.schedules) setSchedules(contact.schedules)
    // Sincronizar el club seleccionado si cambia el contacto
    if (contact.club_id) setSelectedClub(contact.club_id)
  }, [contact])

  const addSchedule = () => setSchedules([...schedules, { day_of_week: 1, start_time: "10:00" }])
  const removeSchedule = (index: number) => {
    if (schedules.length > 1) setSchedules(schedules.filter((_, i) => i !== index))
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    const priceInput = parseFloat(formData.get('price') as string) || 0

    const result = await updateStudentData(contact.student_id, {
      full_name: formData.get('full_name') as string,
      club_id: selectedClub, // Usamos el estado controlado
      level: formData.get('level') as string,
      price_per_class: priceInput,
      schedules: schedules 
    })

    if (result.success) {
      onClose()
      router.refresh()
    } else {
      alert(`Error al actualizar: ${result.error}`)
      setIsSubmitting(false)
    }
  }

  if (!mounted) return null

  const inputClasses = "w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white mt-1.5 outline-none focus:border-[#bdfd2c] transition-all"
  const labelClasses = "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1"

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-start justify-center pt-5 p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative z-10 bg-slate-900 border border-slate-800 px-8 pt-8 pb-5 rounded-[2.5rem] w-full max-w-lg shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-gray-950 dark:text-[#ADFF2F] uppercase italic tracking-tighter">Editar Alumno</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form action={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClasses}>Nombre Completo</label>
            <input name="full_name" defaultValue={contact.full_name} required className={inputClasses} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Sede</label>
              <select 
                value={selectedClub} 
                onChange={(e) => setSelectedClub(e.target.value)}
                required
                className={inputClasses}
              >
                <option value="" disabled>Seleccionar sede...</option>
                {/* VALIDACIÓN: Solo mapeamos si hay clubes disponibles */}
                {clubs && clubs.length > 0 ? (
                  clubs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Cargando sedes...</option>
                )}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Nivel</label>
              <select name="level" defaultValue={contact.level || 'principiante'} className={inputClasses}>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
          </div>

          {/* ... Resto del componente (Horarios y Precio) se mantiene igual ... */}
          <div className="bg-slate-950/50 p-5 rounded-[2rem] border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <p className={labelClasses}>Ajustar Horarios</p>
              <button type="button" onClick={addSchedule} className="text-[10px] font-black text-gray-950 dark:text-[#ADFF2F] hover:underline">+ AÑADIR</button>
            </div>
            <div className="space-y-3">
              {schedules.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select 
                    value={s.day_of_week} 
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none"
                    onChange={(e) => {
                      const n = [...schedules]; n[i].day_of_week = parseInt(e.target.value); setSchedules(n);
                    }}
                  >
                    <option value="1">Lunes</option><option value="2">Martes</option><option value="3">Miércoles</option>
                    <option value="4">Jueves</option><option value="5">Viernes</option><option value="6">Sábado</option><option value="0">Domingo</option>
                  </select>
                  <input 
                    type="time" value={s.start_time} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none"
                    onChange={(e) => {
                      const n = [...schedules]; n[i].start_time = e.target.value; setSchedules(n);
                    }}
                  />
                  {schedules.length > 1 && (
                    <button type="button" onClick={() => removeSchedule(i)} className="text-slate-600 hover:text-rose-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClasses}>Precio x Clase ($)</label>
            <input 
              type="number" 
              name="price" 
              step="0.01"
              defaultValue={(contact.price_per_class_cents || 0) / 100} 
              required 
              className={inputClasses} 
            />
          </div>

          <button disabled={isSubmitting} type="submit" className="w-full bg-[var(--color-accent-secondary)] hover:bg-green-800 dark:bg-[#bdfd2c] dark:hover:bg-[#a5e620] text-white dark:text-slate-950 font-black py-5 rounded-2xl text-sm uppercase tracking-tighter shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
            {isSubmitting ? 'GUARDANDO CAMBIOS...' : 'GUARDAR CAMBIOS'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}