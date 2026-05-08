'use client'

import { useState } from 'react'
import { addStudentToTournament } from '@/app/dashboard/torneos/actions'

type Student = { id: string; full_name: string }

export function AddStudentToCategoryPanel({
  tournamentId,
  categoryId,
  students,
}: {
  tournamentId: string
  categoryId: string
  students: Student[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="cursor-pointer inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-[var(--color-border)] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl whitespace-nowrap"
      >
        + Agregar Alumno
      </button>
      {open && (
        <div className="mt-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl p-5 shadow-2xl w-[min(560px,calc(100vw-2rem))]">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const studentId = String(fd.get('student_id') || '').trim()
              const result = await addStudentToTournament(tournamentId, studentId, categoryId)
              if (result.success) setOpen(false)
            }}
          >
            <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1.5 ml-1">
              Alumno
            </label>
            <select
              name="student_id"
              required
              className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none focus:border-[var(--color-accent)] transition-all"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
            <button className="w-full bg-[var(--color-accent-secondary)] text-[var(--color-text-heading)] py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">
              Agregar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
