'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelClassPayment } from '@/lib/actions/payments'

export function CancelClassPaymentButton({
  classId,
  studentId,
}: {
  classId: string
  studentId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!window.confirm('¿Anular este pago?')) return
    setLoading(true)
    try {
      const result = await cancelClassPayment({ class_id: classId, student_id: studentId })
      if (!result.success) {
        alert(result.error ?? 'Error al anular el pago')
        setLoading(false)
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="text-slate-700 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-500/10 disabled:opacity-50"
      title="Anular pago"
      aria-label="Anular pago"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      </svg>
    </button>
  )
}

