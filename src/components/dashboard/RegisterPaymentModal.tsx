'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { cancelClassPayment, registerClassPayment } from '@/lib/actions/payments'

function formatPesos(amountCents: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format((amountCents || 0) / 100)
}

export function RegisterPaymentModal({
  classId,
  studentId,
  studentName,
  defaultAmountCents,
  existingPayment,
  onClose,
  onSuccess,
}: {
  classId: string
  studentId: string
  studentName: string
  defaultAmountCents: number
  existingPayment?: {
    paid_amount: number
    payment_method: string
  }
  onClose: () => void
  onSuccess: () => void
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!existingPayment
  const [amountPesos, setAmountPesos] = useState<string>(
    String(Math.round(((existingPayment?.paid_amount ?? defaultAmountCents) || 0) / 100)),
  )
  const [method, setMethod] = useState<'cash' | 'transfer' | 'mp'>(
    (existingPayment?.payment_method as any) || 'cash',
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const amountCents = Math.round((parseFloat(amountPesos || '0') || 0) * 100)
    if (amountCents <= 0) {
      setError('Ingresá un monto mayor a $0')
      setIsSubmitting(false)
      return
    }

    const result = await registerClassPayment({
      class_id: classId,
      student_id: studentId,
      amount_cents: amountCents,
      payment_method: method,
    })

    if (!result.success) {
      const msg =
        result?.error
          ? (result.error.startsWith('[') ? 'Revisá los datos ingresados' : result.error)
          : 'Error al registrar el pago.'
      setError(msg)
      setIsSubmitting(false)
      return
    }

    router.refresh()
    onSuccess()
    onClose()
    setIsSubmitting(false)
  }

  const previewCents = Math.round((parseFloat(amountPesos || '0') || 0) * 100)

  async function handleCancelPayment() {
    if (!window.confirm('¿Seguro que querés anular este pago?')) return
    setIsSubmitting(true)
    setError(null)

    const result = await cancelClassPayment({
      class_id: classId,
      student_id: studentId,
    })

    if (!result.success) {
      const msg =
        result?.error
          ? (result.error.startsWith('[') ? 'Revisá los datos ingresados' : result.error)
          : 'Error al anular el pago.'
      setError(msg)
      setIsSubmitting(false)
      return
    }

    router.refresh()
    onSuccess()
    onClose()
    setIsSubmitting(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 bg-[var(--color-bg-page)]/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[var(--color-bg-card-inner)] bg-[var(--color-bg-card)] border border-black/10  p-8 rounded-[2rem] w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-[var(--color-accent)] dark:text-emerald-400 uppercase italic tracking-tighter">
            {isEdit ? 'Editar pago' : 'Registrar pago'} — {studentName}
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] dark:hover:text-[var(--color-text-heading)] transition-colors" aria-label="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Monto ($)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={amountPesos}
              onChange={(e) => setAmountPesos(e.target.value)}
              required
              className="w-full bg-[var(--color-bg-page)] border border-black/10 dark:border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-body)] dark:text-[var(--color-text-heading)] font-bold mt-1 outline-none"
            />
            <p className="text-[10px] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] font-bold uppercase tracking-widest mt-2">
              Total: <span className="text-[var(--color-text-body)] text-[var(--color-text-body)]">{formatPesos(previewCents)}</span>
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-[var(--color-text-muted)] dark:text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Método</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full bg-[var(--color-bg-page)] border border-black/10 dark:border-[var(--color-border)] rounded-xl p-3 text-sm text-[var(--color-text-body)] dark:text-[var(--color-text-heading)] font-bold mt-1 outline-none"
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="mp">Mercado Pago</option>
            </select>
          </div>

          {error && (
            <div className="px-5 py-4 rounded-2xl border shadow-2xl text-xs font-black uppercase tracking-widest bg-red-50 dark:bg-rose-950/30 border-red-200 dark:border-rose-900/40 text-red-600 dark:text-red-400" role="status">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 bg-[var(--color-bg-card-inner)] text-gray-700 dark:text-[var(--color-text-muted)] font-bold py-3 rounded-2xl text-sm"
            >
              Cancelar
            </button>
            {isEdit && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCancelPayment}
                className="flex-1 bg-transparent border border-red-300 dark:border-rose-500/40 text-red-600 dark:text-red-400 font-black py-3 rounded-2xl text-sm uppercase tracking-widest hover:bg-red-50 dark:hover:bg-rose-500/10 disabled:opacity-50"
              >
                Anular pago
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 text-[var(--color-text-heading)] font-black py-3 rounded-2xl text-sm shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (isEdit ? 'GUARDANDO...' : 'REGISTRANDO...') : (isEdit ? 'Guardar cambios' : 'Registrar pago')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

