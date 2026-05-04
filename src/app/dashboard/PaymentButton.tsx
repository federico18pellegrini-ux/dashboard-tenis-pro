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
    if (!confirm(`¿Confirmar pago de $${amount / 100} para ${studentName}?`)) return
    
    setLoading(true)
    try {
      const result = await registerPayment(studentId, amount)
      if (!result.success) alert('Error al registrar el pago')
    } catch (err) {
      alert('Hubo un problema de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handlePayment}
      disabled={loading}
      className={`text-[10px] px-2 py-1 rounded font-bold transition-colors ${
        loading 
          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
          : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
    >
      {loading ? '...' : 'PAGAR'}
    </button>
  )
}