'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

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
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, left: Math.max(8, rect.right - 220) })
    }
    setOpen(true)
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[var(--color-bg-card-inner)] text-[var(--color-success)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors shrink-0"
      >
        ✓ Pagado
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed z-[9999] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-4 shadow-2xl w-[220px]"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">Editar pago</span>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]">
                ✕
              </button>
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
          </div>,
          document.body,
        )}
    </>
  )
}
