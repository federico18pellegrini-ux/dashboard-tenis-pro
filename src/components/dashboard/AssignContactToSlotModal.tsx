'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { formatPhoneForDisplay } from '@/lib/utils/phone'
import { assignContactToSlot } from '@/lib/actions/schedules'
import { AddContactModal } from '@/components/contacts/AddContactModal'

type ToastState =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

type ContactRow = {
  id: string
  full_name: string
  phone: string
  status: 'unclassified' | 'student' | string
}

const DAYS: Array<{ label: string; value: number }> = [
  { label: 'Domingo', value: 0 },
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (a + b).toUpperCase()
}

export function AssignContactToSlotModal(props: {
  open: boolean
  onClose: () => void
  dayOfWeek: number
  startTime: string
  clubId: string
  clubName: string
}) {
  const { open, onClose, dayOfWeek, startTime, clubId, clubName } = props
  const router = useRouter()

  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigningId, setIsAssigningId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>({ kind: 'idle' })

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const dayLabel = useMemo(
    () => DAYS.find((d) => d.value === dayOfWeek)?.label ?? `Día ${dayOfWeek}`,
    [dayOfWeek],
  )

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function run() {
      setIsLoading(true)
      setToast({ kind: 'idle' })

      const supabase = createSupabaseBrowserClient()

      let q = supabase
        .from('contacts')
        .select('id, full_name, phone, status')
        .in('status', ['unclassified', 'student'])
        .order('full_name', { ascending: true })
        .limit(50)

      if (debouncedQuery.length > 0) {
        const like = `%${debouncedQuery}%`
        q = q.or(`full_name.ilike.${like},phone.ilike.${like}`)
      }

      const { data, error } = await q
      if (cancelled) return

      if (error) {
        setContacts([])
        setToast({ kind: 'error', message: error.message })
      } else {
        setContacts((data ?? []) as ContactRow[])
      }

      setIsLoading(false)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [open, debouncedQuery])

  async function handleAssign(contact: ContactRow) {
    setIsAssigningId(contact.id)
    setToast({ kind: 'idle' })

    try {
      const result = await assignContactToSlot({
        contactId: contact.id,
        dayOfWeek,
        startTime,
        clubId,
      })

      if (!result.success) {
        setToast({ kind: 'error', message: result.error ?? 'No se pudo asignar.' })
        router.refresh()
        setIsAssigningId(null)
        return
      }

      setToast({ kind: 'success', message: 'Alumno asignado.' })
      router.refresh()
      onClose()
    } catch (e: any) {
      setToast({ kind: 'error', message: e?.message ?? 'Error inesperado.' })
    } finally {
      setIsAssigningId(null)
    }
  }

  if (!open || !mounted) return null

  const badgeClass = (status: string) =>
    status === 'student'
      ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300'
      : 'bg-slate-950 border-slate-800 text-slate-300'

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-800/60">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none italic">
              Asignar alumno
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
              {dayLabel} a las {startTime} en {clubName}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-600 hover:text-rose-500 transition-colors p-2 bg-slate-950 rounded-xl border border-slate-800"
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">
              Buscar contacto
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre o teléfono…"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-[#bdfd2c] transition-all"
            />
          </div>

          {toast.kind !== 'idle' && (
            <div
              className={[
                'px-5 py-4 rounded-2xl border shadow-2xl text-xs font-black uppercase tracking-widest',
                toast.kind === 'success'
                  ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-900/40 text-rose-300',
              ].join(' ')}
              role="status"
            >
              {toast.message}
            </div>
          )}

          <div className="bg-slate-950/30 border border-slate-800/60 rounded-[2rem] overflow-hidden">
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar divide-y divide-slate-800/60">
              {isLoading ? (
                <div className="p-5 text-xs text-slate-500 font-bold">Buscando…</div>
              ) : contacts.length === 0 ? (
                <div className="p-5 text-xs text-slate-500 font-bold">Sin resultados.</div>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleAssign(c)}
                    disabled={isAssigningId === c.id}
                    className="w-full text-left p-5 flex items-center justify-between hover:bg-slate-900/40 transition-colors disabled:opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300 font-black text-xs">
                        {initials(c.full_name)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-100 uppercase tracking-tight leading-none">
                          {c.full_name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                          {formatPhoneForDisplay(c.phone)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border',
                          badgeClass(c.status),
                        ].join(' ')}
                      >
                        {c.status === 'student' ? 'Alumno' : 'Prospecto'}
                      </span>
                      <span className="text-slate-600">{isAssigningId === c.id ? '…' : 'Asignar'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800/60 flex items-center justify-between">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">¿No está en la lista?</div>

              {/* Abre el modal existente */}
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-heading)] ">
                <AddContactModal />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

