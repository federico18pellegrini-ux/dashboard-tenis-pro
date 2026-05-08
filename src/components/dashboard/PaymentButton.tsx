'use client'

import { useState } from 'react'
import { registerPayment } from '@/app/dashboard/actions'

export function PaymentButton({ 
  studentId, 
  amount, 
  studentName 
}: { 
  studentId: string, 
  amount: number, 
  studentName: string 
}) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    // Una validación rápida antes de ejecutar el movimiento
    if (!confirm(`¿Confirmar cobro de $${amount / 100} para ${studentName}?`)) return
    
    setLoading(true)
    try {
      const result = await registerPayment(studentId, amount)
      if (!result.success) alert('Error en la transacción')
    } catch (err) {
      alert('Error de conexión con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handlePayment}
      disabled={loading}
      className={`text-[10px] px-2 py-1 rounded font-bold transition-all shadow-sm ${
        loading 
          ? 'bg-slate-200 text-[var(--color-text-muted)] cursor-wait' 
          : 'bg-emerald-600 text-[var(--color-text-heading)] hover:bg-emerald-700 active:transform active:scale-95'
      }`}
    >
      {loading ? 'PROCESANDO...' : 'PAGAR'}
    </button>
  )
}