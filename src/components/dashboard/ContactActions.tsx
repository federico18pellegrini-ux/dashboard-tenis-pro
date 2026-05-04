'use client'

import { useState } from 'react'
import { deleteContact } from '@/app/dashboard/actions'
import { useRouter } from 'next/navigation'

export function ContactActions({ contactId }: { contactId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    // Validación de seguridad para evitar errores accidentales
    const confirmDelete = confirm(
      "⚠ ATENCIÓN: Esta acción eliminará al contacto y TODOS sus datos vinculados (horarios, pagos, etc.) de forma PERMANENTE. ¿Confirmás?"
    )
    
    if (confirmDelete) {
      setIsDeleting(true)
      const result = await deleteContact(contactId)[cite: 1]
      
      if (result.success) {
        setIsOpen(false)
        router.refresh()
      } else {
        alert(`Error: ${result.error}`)
      }
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative flex justify-end">
      {/* Botón disparador (Tres puntos) */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="text-slate-600 hover:text-[#bdfd2c] p-2 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop para cerrar al hacer clic afuera */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Menú Flotante Dark Premium */}
          <div className="absolute right-0 mt-8 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 py-2 animate-in fade-in zoom-in duration-150">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              Editar Datos
            </button>
            
            <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-slate-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
              Archivar
            </button>

            {/* Separador y Acción Crítica */}
            <div className="border-t border-slate-800 mt-2 pt-2">
              <button 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                {isDeleting ? 'Eliminando...' : 'Eliminar Permanente'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}