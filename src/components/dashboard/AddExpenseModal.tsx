'use client'

import { useState, useEffect } from 'react' // Importación estándar
import { createPortal } from 'react-dom'
import { addExpense } from '@/app/dashboard/actions'
import { useRouter } from 'next/navigation'

export function AddExpenseModal({ clubs }: { clubs: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  // FIX: El hook ahora se llama correctamente en el cuerpo de la función
  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    const amountStr = formData.get('amount') as string
    const price = Math.round(parseFloat(amountStr) * 100)

    const result = await addExpense({
      club_id: formData.get('club_id') as string,
      amount_cents: price,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      expense_date: formData.get('date') as string,
    })

    if (result.success) {
      setIsOpen(false)
      router.refresh()
    } else {
      alert(`Error: ${result.error}`)
    }
    setIsSubmitting(false)
  }

  // Si no está abierto o no se ha montado en el cliente, mostramos el disparador
  if (!isOpen || !mounted) return (
    <button 
      onClick={() => setIsOpen(true)} 
      className="bg-slate-900 border border-slate-800 text-rose-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:border-rose-500/30 transition-all shadow-lg flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
      Registrar Gasto
    </button>
  )

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
        {/* ... Resto del formulario igual que antes ... */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-rose-400 uppercase italic tracking-tighter">Nuevo Egreso</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sede</label>
              <select name="club_id" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold mt-1 outline-none">
                <option value="">Seleccionar...</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</label>
              <select name="category" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold mt-1 outline-none">
                <option value="sueldos">Sueldos</option>
                <option value="alquiler">Alquiler Cancha</option>
                <option value="servicios">Servicios</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monto ($)</label>
              <input type="number" name="amount" required placeholder="Ej: 50000" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold mt-1 outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha</label>
              <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white font-bold mt-1 outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Concepto</label>
            <input name="description" placeholder="Ej: Pago de luz abril..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 mt-1 outline-none" />
          </div>

          <button disabled={isSubmitting} type="submit" className="w-full bg-rose-500 text-white font-black py-4 rounded-xl text-sm uppercase tracking-widest shadow-[0_5px_15px_rgba(244,63,94,0.2)] hover:scale-[1.02] active:scale-95 transition-all mt-4">
            {isSubmitting ? 'PROCESANDO...' : 'ASENTAR GASTO'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}