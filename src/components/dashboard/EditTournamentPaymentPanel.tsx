'use client'

import { useState } from 'react'

export function EditTournamentPaymentPanel({
  studentId,
  categoryId,
  defaultMethod,
  defaultAmountPesos,
  editPaymentAction,
}: {
  studentId: string
  categoryId: string
  defaultMethod: string
  defaultAmountPesos: number
  editPaymentAction: (formData: FormData) => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[var(--color-bg-card-inner)] text-[var(--color-success)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
      >
        ✓ Pagado
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-10 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xl min-w-[220px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Editar pago</span>
            <button onClick={() => setOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]">✕</button>
          </div>
          <form
            action={async (formData) => {
              await editPaymentAction(formData)
              setOpen(false)
            }}
            className="space-y-3"
          >
            <input type="hidden" name="student_id" value={studentId} />
            <input type="hidden" name="category_id" value={categoryId} />
            <div>
              <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1">Método</label>
              <select name="method" defaultValue={defaultMethod} className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-2 text-xs font-bold text-[var(--color-text-body)] outline-none">
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="mp">Mercado Pago</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest block mb-1">Monto ($)</label>
              <input type="number" name="amount_cents" defaultValue={defaultAmountPesos} className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-2 text-xs font-bold text-[var(--color-text-body)] outline-none" />
            </div>
            <button type="submit" className="w-full bg-[var(--color-accent)] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
              Guardar
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
