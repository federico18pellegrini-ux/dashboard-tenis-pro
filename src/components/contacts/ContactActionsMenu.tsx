'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { EditStudentModal } from './EditStudentModal'
import { deleteContact } from '@/lib/actions/contacts' // Corregido el path si usas la nueva estructura
import { useRouter } from 'next/navigation'
import { AddToClassModal } from '@/components/contacts/AddToClassModal'

export function ContactActionsMenu({ contact, clubs = [] }: { contact: any, clubs: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddToClassModal, setShowAddToClassModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  
  const router = useRouter()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const toggleMenu = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({ 
        top: rect.bottom + window.scrollY, 
        left: rect.left - 150 + window.scrollX 
      })
    }
    setIsOpen(!isOpen)
  }

  const handleDelete = async () => {
    const confirmDelete = confirm(
      "⚠ ATENCIÓN: Esta acción eliminará al contacto y todos sus datos vinculados de forma PERMANENTE. ¿Deseas continuar?"
    )
    
    if (confirmDelete) {
      setIsDeleting(true)
      const result = await deleteContact(contact.id)
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
    <>
      <button 
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-2 text-slate-600 hover:text-[#bdfd2c] transition-colors bg-[var(--color-bg-page)] rounded-xl border border-transparent hover:border-[var(--color-border)] shadow-xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>

      {/* MENÚ FLOTANTE VÍA PORTAL */}
      {isOpen && mounted && createPortal(
        <div 
          ref={menuRef}
          className="fixed z-[9999] w-48 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
          style={{ top: coords.top + 8, left: coords.left }}
        >
          <button 
            className="w-full text-left px-4 py-3 text-xs font-black text-[var(--color-text-body)] hover:bg-[var(--color-bg-card-inner)] hover:text-[#bdfd2c] transition-colors flex items-center gap-3 uppercase tracking-widest"
            onClick={() => {
              setShowEditModal(true)
              setIsOpen(false)
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            Editar Datos
          </button>

          {!!contact?.student_id && (
            <button
              className="w-full text-left px-4 py-3 text-xs font-black text-[var(--color-text-body)] hover:bg-[var(--color-bg-card-inner)] hover:text-[#bdfd2c] transition-colors flex items-center gap-3 uppercase tracking-widest"
              onClick={() => {
                setShowAddToClassModal(true)
                setIsOpen(false)
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14"/><path d="M5 12h14"/>
              </svg>
              + Agregar a clase
            </button>
          )}

          <div className="border-t border-[var(--color-border)] mt-2 pt-2">
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full text-left px-4 py-3 text-xs font-black text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-3 uppercase tracking-widest disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              {isDeleting ? 'ELIMINANDO...' : 'ELIMINAR PERMANENTE'}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE EDICIÓN (Removida la prop isOpen que causaba el error) */}
      {showEditModal && (
        <EditStudentModal 
          contact={contact} 
          clubs={clubs} 
          onClose={() => setShowEditModal(false)} 
        />
      )}

      {showAddToClassModal && (
        <AddToClassModal
          studentId={contact.student_id}
          studentName={contact.full_name ?? 'Alumno'}
          onClose={() => setShowAddToClassModal(false)}
        />
      )}
    </>
  )
}