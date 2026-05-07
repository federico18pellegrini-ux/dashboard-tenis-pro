'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { formatPhoneForDisplay } from '@/lib/utils/phone'
import { createScheduleSlot, deleteScheduleSlot, updateScheduleSlot } from '@/lib/actions/schedules'

export interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  club_id: string
  clubs: { name: string } | null
}

export interface StudentProps {
  id: string
  full_name: string
  phone: string
  price_per_class_cents: number
  level: string
  club_id: string
  schedules: Schedule[]
}

export function StudentDetailModal({ 
  student, 
  isOpen, 
  onClose,
  clubs = [] // Recibimos la lista de sedes para el select
}: { 
  student: StudentProps, 
  isOpen: boolean, 
  onClose: () => void,
  clubs?: any[]
}) {
  const [mounted, setMounted] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  type FeedbackState =
    | { kind: 'idle'; message: '' }
    | { kind: 'error'; message: string }

  const [feedback, setFeedback] = useState<FeedbackState>({ kind: 'idle', message: '' })

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editingScheduleId || showCreateForm) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }, 50)
    }
  }, [editingScheduleId, showCreateForm])

  const days = useMemo(
    () => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    [],
  )

  function toHHMM(t: string) {
    return t.length >= 5 ? t.slice(0, 5) : t
  }

  const sortedSchedules = useMemo(() => {
    return [...(student.schedules ?? [])].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
      return toHHMM(a.start_time).localeCompare(toHHMM(b.start_time))
    })
  }, [student.schedules])

  async function handleEditSchedule(scheduleId: string, formData: FormData) {
    setIsSubmitting(true)
    setFeedback({ kind: 'idle', message: '' })

    const dayOfWeek = parseInt(formData.get('day_of_week') as string, 10)
    const startTime = (formData.get('start_time') as string) || ''
    const clubId = (formData.get('club_id') as string) || ''

    const result = await updateScheduleSlot({
      scheduleId,
      dayOfWeek,
      startTime,
      clubId,
    })

    if (!result.success) {
      setFeedback({ kind: 'error', message: result.error ?? 'Error al guardar el turno.' })
      setIsSubmitting(false)
      return
    }

    setEditingScheduleId(null)
    setFeedback({ kind: 'idle', message: '' })
    router.refresh()
    setIsSubmitting(false)
  }

  async function handleDeleteSchedule(sched: Schedule) {
    const dayName = days[sched.day_of_week] ?? 'Día'
    const time = toHHMM(sched.start_time)
    const clubName = sched.clubs?.name || clubs.find((c: any) => c.id === sched.club_id)?.name || 'Sede'

    const confirmed = window.confirm(
      `¿Borrar el turno del ${dayName} ${time} en ${clubName}?\n\nEsto NO borra al alumno, solo este horario.`,
    )
    if (!confirmed) return

    setIsSubmitting(true)
    setFeedback({ kind: 'idle', message: '' })

    const result = await deleteScheduleSlot({ scheduleId: sched.id })

    if (!result.success) {
      setFeedback({ kind: 'error', message: result.error ?? 'Error al eliminar el turno.' })
      setIsSubmitting(false)
      return
    }

    if (editingScheduleId === sched.id) setEditingScheduleId(null)
    router.refresh()
    setIsSubmitting(false)
  }

  async function handleCreateSchedule(formData: FormData) {
    setIsSubmitting(true)
    setFeedback({ kind: 'idle', message: '' })

    const dayOfWeek = parseInt(formData.get('day_of_week') as string, 10)
    const startTime = (formData.get('start_time') as string) || ''
    const clubId = (formData.get('club_id') as string) || ''

    const result = await createScheduleSlot({
      studentId: student.id,
      dayOfWeek,
      startTime,
      clubId,
    })

    if (!result.success) {
      setFeedback({ kind: 'error', message: result.error ?? 'Error al crear el turno.' })
      setIsSubmitting(false)
      return
    }

    setShowCreateForm(false)
    setFeedback({ kind: 'idle', message: '' })
    router.refresh()
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
            <div className="h-14 w-14 rounded-full bg-slate-950 border border-[#bdfd2c]/30 flex items-center justify-center font-black text-green-500 dark:text-[#ADFF2F] text-xl italic">
              {student.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2 italic">
                {student.full_name}
              </h2>
              <p className="text-xs text-slate-500 font-bold tracking-[0.15em]">
                {formatPhoneForDisplay(student.phone)}
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

        <div className="space-y-5 overflow-y-auto max-h-[55vh] pr-2 custom-scrollbar">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
            Horarios fijos
          </h3>

          <div className="space-y-3">
          {sortedSchedules.map(sched => {
            const isEditing = editingScheduleId === sched.id

            if (isEditing) {
              return (
                <div ref={editingScheduleId === sched.id ? formRef : null}>
                  <form
                    key={sched.id}
                    onSubmit={(e) => {
                      e.preventDefault()
                      void handleEditSchedule(sched.id, new FormData(e.currentTarget))
                    }}
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
                        <label className={labelClasses}>Hora</label>
                        <input type="time" name="start_time" defaultValue={toHHMM(sched.start_time)} required className={inputClasses} />
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>Club</label>
                      <select name="club_id" defaultValue={sched.club_id} className={inputClasses}>
                        {clubs.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {feedback.kind === 'error' && (
                      <div
                        className="px-5 py-4 rounded-2xl border shadow-2xl text-xs font-black uppercase tracking-widest bg-rose-950/30 border-rose-900/40 text-rose-300"
                        role="status"
                      >
                        {feedback.message}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingScheduleId(null)
                          setFeedback({ kind: 'idle', message: '' })
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 text-slate-500 py-3 rounded-xl text-[10px] font-black uppercase transition-all"
                      >
                        Cerrar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-green-700 hover:bg-green-800 dark:bg-[#bdfd2c] dark:hover:bg-[#a5e620] text-white dark:text-slate-950 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50"
                      >
                        {isSubmitting ? '...' : 'OK'}
                      </button>
                    </div>
                  </form>
                </div>
              )
            }

            return (
              <div 
                key={sched.id} 
                className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800/60 flex justify-between items-center group"
              >
                <div>
                  <p className="text-sm font-black text-slate-100 italic uppercase">
                    {days[sched.day_of_week]} <span className="text-gray-950 dark:text-[#ADFF2F] ml-1">{toHHMM(sched.start_time)}hs</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {sched.clubs?.name || clubs.find((c: any) => c.id === sched.club_id)?.name || 'Sede'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setFeedback({ kind: 'idle', message: '' })
                      setEditingScheduleId(sched.id)
                    }}
                    className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-500 hover:text-[#bdfd2c] transition-all"
                    title="Editar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleDeleteSchedule(sched)}
                    className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-slate-500 hover:text-rose-500 transition-all disabled:opacity-60"
                    title="Eliminar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
              </div>
            )
          })}
          </div>

          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => {
                setEditingScheduleId(null)
                setFeedback({ kind: 'idle', message: '' })
                setShowCreateForm(true)
              }}
              className="w-full bg-green-700 hover:bg-green-800 dark:bg-[#bdfd2c] dark:hover:bg-[#a5e620] text-white dark:text-slate-950 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg"
            >
              + Agregar otro turno
            </button>
          ) : (
            <div ref={showCreateForm ? formRef : null}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleCreateSchedule(new FormData(e.currentTarget))
                }}
                className="bg-slate-950 p-6 rounded-[2rem] border border-[#bdfd2c]/40 space-y-5 animate-in slide-in-from-top-2"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Día</label>
                    <select name="day_of_week" defaultValue={1} className={inputClasses}>
                      {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Hora</label>
                    <input type="time" name="start_time" defaultValue="09:00" required className={inputClasses} />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Club</label>
                  <select name="club_id" defaultValue={student.club_id} className={inputClasses}>
                    {clubs.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {feedback.kind === 'error' && (
                  <div
                    className="px-5 py-4 rounded-2xl border shadow-2xl text-xs font-black uppercase tracking-widest bg-rose-950/30 border-rose-900/40 text-rose-300"
                    role="status"
                  >
                    {feedback.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setFeedback({ kind: 'idle', message: '' })
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-500 py-3 rounded-xl text-[10px] font-black uppercase transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-green-700 hover:bg-green-800 dark:bg-[#bdfd2c] dark:hover:bg-[#a5e620] text-white dark:text-slate-950 py-3 rounded-xl text-[10px] font-black uppercase shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : 'OK'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-2">
            Para editar precio o nombre del alumno, andá a Contactos.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}