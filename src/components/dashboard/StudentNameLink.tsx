'use client'

import { useState } from 'react'
import { EditStudentModal } from '../contacts/EditStudentModal'

/**
 * Componente para vincular el nombre del alumno con el modal de edición
 * @param {Object} props
 * @param {any} props.student
 * @param {any[]} props.clubs
 */
export function StudentNameLink({ student, clubs = [] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!student) return null

  return (
    <>
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault()
          setIsModalOpen(true)
        }}
        className="text-xs font-black text-slate-100 mb-5 uppercase leading-tight italic tracking-tight hover:text-[#bdfd2c] transition-colors text-left w-full group"
      >
        <span className="border-b border-transparent group-hover:border-[#bdfd2c]">
          {student.full_name}
        </span>
      </button>

      {isModalOpen && (
        <EditStudentModal 
          contact={{
            ...student,
            student_id: student.id // Sincronización para updateStudentData
          }} 
          clubs={clubs} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  )
}