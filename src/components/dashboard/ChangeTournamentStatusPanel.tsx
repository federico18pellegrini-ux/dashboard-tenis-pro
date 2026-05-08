'use client'

import { useState } from 'react'

export function ChangeTournamentStatusPanel({
  currentStatus,
  updateStatusAction,
}: {
  currentStatus: string
  updateStatusAction: (formData: FormData) => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center justify-center bg-[var(--color-bg-card-inner)] border border-[var(--color-border)] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-text-body)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors shadow-xl"
      >
        Cambiar estado
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-4 shadow-2xl min-w-[200px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Estado</span>
            <button type="button" onClick={() => setOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]">
              ✕
            </button>
          </div>
          <form
            action={async (formData) => {
              await updateStatusAction(formData)
              setOpen(false)
            }}
            className="space-y-3"
          >
            <select
              name="status"
              defaultValue={currentStatus}
              className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-3 text-xs text-[var(--color-text-heading)] font-bold outline-none"
            >
              <option value="upcoming">Próximo</option>
              <option value="in_progress">En curso</option>
              <option value="finished">Finalizado</option>
            </select>
            <button type="submit" className="w-full bg-[var(--color-accent)] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
              Actualizar estado
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
