'use client'

import { useState } from 'react'
import { EditStudentModal } from '../contacts/EditStudentModal'

interface StudentNameLinkProps {
  student: {
    id: string;
    full_name: string;
    [key: string]: any;
  };
  clubs?: any[];
}

export function StudentNameLink({ student, clubs = [] }: StudentNameLinkProps) {
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
        className="text-xs font-black text-[var(--color-text-heading)] mb-5 uppercase leading-tight italic tracking-tight hover:text-[#bdfd2c] transition-colors text-left w-full group"
      >
        <span className="border-b border-transparent group-hover:border-[#bdfd2c]">
          {student.full_name}
        </span>
      </button>

      {isModalOpen && (
        <EditStudentModal 
          contact={{
            ...student,
            student_id: student.id
          }} 
          clubs={clubs} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  )
}