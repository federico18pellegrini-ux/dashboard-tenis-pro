'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { promoteContactToStudent } from '@/lib/actions/contacts'
import { useRouter } from 'next/navigation'

export function PromoteToStudentModal({ contact, clubs }: { contact: any, clubs: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Estado inicial: 1 horario por defecto (Lunes 10:00)
  const [schedules, setSchedules] = useState([{ day_of_week: 1, start_time: "10:00" }])
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const addSchedule = () => {
    setSchedules([...schedules, { day_of_week: 1, start_time: "10:00" }])
  }
  
  const removeSchedule = (indexToRemove: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, index) => index !== indexToRemove))
    }
  }

  const handleAction = async (formData: FormData) => {
    setIsSubmitting(true)
    
    // Convertimos a número el precio para enviarlo a la acción
    const pricePerClass = parseFloat(formData.get('price') as string)
    
    // FIX: Llamada con dos argumentos (ID, Objeto de datos) según definición en actions.ts
    const result = await promoteContactToStudent(contact.id, {
      club_id: formData.get('club_id') as string,
      level: formData.get('level') as string,
      price_per_class: pricePerClass,
      // Aunque promoteContactToStudent en actions.ts no procesaba schedules aún, 
      // lo incluimos si decides extender la acción luego.
      // @ts-ignore (Si el tipo en la acción aún no incluye schedules)
      schedules: schedules 
    })

    if (result.success) {
      setIsOpen(false)
      router.refresh()
    } else {
      alert(`Error: ${result.error}`)
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsOpen(false)} />
      
      <div className="relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black tracking-tighter text-gray-950 dark:text-[#ADFF2F] uppercase italic">Convertir Alumno</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form action={handleAction} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre Completo</label>
            <input type="text" name="full_name" defaultValue={contact.full_name} required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sede</label>
              <select name="club_id" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white mt-1">
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nivel</label>
              <select name="level" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white mt-1">
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
          </div>

          {/* MÚLTIPLES HORARIOS */}
          <div className="bg-slate-950/50 p-5 rounded-[1.5rem] border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Horarios Fijos</p>
              <button 
                type="button" 
                onClick={addSchedule} 
                className="text-[10px] font-black text-gray-950 dark:text-[#ADFF2F] hover:underline"
              >
                + AÑADIR DÍA
              </button>
            </div>
              
             <div className="space-y-3">
               {schedules.map((s, i) => (
                 <div key={i} className="flex gap-2 items-center animate-in fade-in">
                   <select 
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white" 
                      value={s.day_of_week} 
                      onChange={(e) => {
                        const newSchedules = [...schedules]; 
                        newSchedules[i].day_of_week = parseInt(e.target.value); 
                        setSchedules(newSchedules);
                      }}
                    >
                     <option value="1">Lunes</option><option value="2">Martes</option>
                     <option value="3">Miércoles</option><option value="4">Jueves</option>
                     <option value="5">Viernes</option><option value="6">Sábado</option>
                     <option value="0">Domingo</option>
                   </select>
                   <input 
                      type="time" 
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white" 
                      value={s.start_time} 
                      onChange={(e) => {
                        const newSchedules = [...schedules]; 
                        newSchedules[i].start_time = e.target.value; 
                        setSchedules(newSchedules);
                      }} 
                    />
                   {schedules.length > 1 && (
                     <button type="button" onClick={() => removeSchedule(i)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                     </button>
                   )}
                 </div>
               ))}
             </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Precio por Clase ($)</label>
            <input type="number" name="price" required className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-white mt-1" placeholder="Ej: 12000" />
            <p className="text-[10px] text-slate-600 mt-1 ml-1">* El sistema calculará el total mensual según las clases del mes.</p>
          </div>

          <button disabled={isSubmitting} type="submit" className="w-full bg-[var(--color-accent-secondary)] hover:bg-green-800 dark:bg-[#bdfd2c] dark:hover:bg-[#a5e620] text-white dark:text-slate-950 font-black py-5 rounded-2xl text-sm uppercase shadow-[0_10px_20px_rgba(189,253,44,0.3)]">
            {isSubmitting ? 'PROCESANDO...' : 'CONFIRMAR ALTA'}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="text-[10px] font-black bg-[var(--color-accent-secondary)] hover:bg-green-800 dark:bg-[#bdfd2c] dark:hover:bg-[#a5e620] text-white dark:text-slate-950 px-4 py-2 rounded-xl uppercase hover:scale-105 transition-transform">
        Convertir
      </button>
      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  )
}