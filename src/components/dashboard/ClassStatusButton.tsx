'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateClassStatus } from '@/lib/actions/classes'

type Status =
  | 'scheduled'
  | 'reminder_sent'
  | 'confirmed'
  | 'cancelled_by_student'
  | 'cancelled_by_coach'
  | 'completed'
  | 'no_show'

function labelFor(status: string) {
  if (status === 'completed') return 'Completada'
  if (status === 'cancelled_by_coach' || status === 'cancelled_by_student') return 'Cancelada'
  return 'Programada'
}

export function ClassStatusButton({
  classId,
  currentStatus,
}: {
  classId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<null | Status>(null)

  async function setStatus(next: Status) {
    setLoading(next)
    try {
      const res = await updateClassStatus({ class_id: classId, status: next })
      if (!res.success) {
        alert(res.error ?? 'Error al actualizar el estado')
        return
      }
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const status = (currentStatus || 'scheduled') as Status

  if (status === 'scheduled') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!!loading}
          onClick={() => void setStatus('cancelled_by_coach')}
          className="bg-transparent border border-rose-500/40 text-rose-300 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 disabled:opacity-50"
          title="Cancelar clase"
        >
          ✗ Cancelar
        </button>
      </div>
    )
  }

  const badgeCls =
    status === 'completed'
      ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300'
      : 'bg-rose-950/30 border-rose-900/40 text-rose-300'

  return (
    <div className="flex items-center gap-2">
      <span className={['px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-widest', badgeCls].join(' ')}>
        {labelFor(status)}
      </span>
      <button
        type="button"
        disabled={!!loading}
        onClick={() => void setStatus('scheduled')}
        className="bg-[var(--color-bg-page)] border border-[var(--color-border)] text-[var(--color-text-body)] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-[var(--color-border)] disabled:opacity-50"
        title="Reabrir (volver a programada)"
      >
        Reabrir
      </button>
    </div>
  )
}

