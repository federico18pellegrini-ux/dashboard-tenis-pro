'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createManualContact } from '@/lib/actions/contacts'
import { useRouter } from 'next/navigation'

/** Tras crear, abre Pendientes con aviso visible (opción D). */
const PENDIENTES_AFTER_CREATE = '/dashboard/contactos?status=unclassified&prospecto_creado=1'

type AddContactModalProps = {
  /**
   * `page` (default): tras crear, va a Pendientes para que el nuevo contacto sea visible.
   * `embedded`: no navega (p. ej. modal de asignación); usar `onCreated` para refrescar datos locales.
   */
  mode?: 'page' | 'embedded'
  onCreated?: () => void
}

export function AddContactModal({ mode = 'page', onCreated }: AddContactModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitHint, setSubmitHint] = useState<null | { duplicate: boolean; message: string }>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setSubmitHint(null)
    const tagsRaw = String(formData.get('tags') ?? '')
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '')

    const result = await createManualContact({
      full_name: String(formData.get('full_name') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      tags,
      notes: String(formData.get('notes') ?? ''),
    })

    if (result.success) {
      setIsOpen(false)
      onCreated?.()
      if (mode === 'page') {
        router.push(PENDIENTES_AFTER_CREATE)
      }
      router.refresh()
    } else {
      setSubmitHint({
        duplicate: result.code === 'duplicate',
        message: result.error,
      })
    }
    setLoading(false)
  }

  if (!isOpen)
    return (
      <button
        type="button"
        onClick={() => {
          setSubmitHint(null)
          setIsOpen(true)
        }}
        className="w-full md:w-auto bg-[var(--color-accent-secondary)] hover:bg-green-800  dark:hover:bg-[#a5e620] text-[var(--color-text-heading)] dark:text-slate-950 px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-[0_10px_20px_rgba(189,253,44,0.2)] uppercase tracking-tighter"
      >
        + Nuevo posible alumno
      </button>
    )

  return (
    <div className="fixed inset-0 bg-[var(--color-bg-page)]/90 backdrop-blur-sm z-[11000] flex items-center justify-center p-4">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-8 rounded-[2.5rem] w-full max-w-md space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black tracking-tighter text-[var(--color-text-heading)]  uppercase italic">Nuevo posible alumno</h2>
        <form action={handleSubmit} className="space-y-4">
          {submitHint && (
            <div
              role="alert"
              className="rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-200 space-y-2"
            >
              <p className="leading-snug">{submitHint.message}</p>
              {submitHint.duplicate && (
                <p>
                  <Link
                    href="/dashboard/contactos?status=unclassified"
                    className="inline-flex font-black uppercase tracking-widest text-[10px] text-[var(--color-accent)] underline underline-offset-2 hover:opacity-90"
                  >
                    Ir a Pendientes →
                  </Link>
                </p>
              )}
            </div>
          )}
          <div>
            <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Nombre Completo</label>
            <input name="full_name" required className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-4 text-sm font-bold text-[var(--color-text-heading)] outline-none focus:border-[#bdfd2c] transition-all mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Teléfono</label>
            <input name="phone" required className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-4 text-sm font-bold text-[var(--color-text-heading)] outline-none focus:border-[#bdfd2c] transition-all mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest ml-1">Etiquetas (separadas por coma)</label>
            <input name="tags" className="w-full bg-[var(--color-bg-page)] border border-[var(--color-border)] rounded-xl p-4 text-sm font-bold text-[var(--color-text-heading)] outline-none focus:border-[#bdfd2c] transition-all mt-1" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => { setSubmitHint(null); setIsOpen(false) }} className="flex-1 bg-[var(--color-bg-card-inner)] text-[var(--color-text-muted)] font-bold py-4 rounded-2xl text-sm">CANCELAR</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[var(--color-accent-secondary)] hover:bg-green-800  dark:hover:bg-[#a5e620] text-[var(--color-text-heading)] dark:text-slate-950 font-black py-4 rounded-2xl text-sm shadow-[0_0_20px_rgba(189,253,44,0.3)] disabled:opacity-50">
              {loading ? 'GUARDANDO...' : 'CREAR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}