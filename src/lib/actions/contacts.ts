'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/utils/phone'

/**
 * 1. CREAR CONTACTO MANUAL
 * Registra prospectos en estado 'unclassified'.
 */
export async function createManualContact(data: {
  full_name: string;
  phone: string;
  tags?: string[];
}) {
  try {
    const supabase = await createSupabaseServerClient()
    const sanitizedPhone = normalizePhone(data.phone)

    const { error } = await supabase
      .from('contacts')
      .insert({
        full_name: data.full_name,
        phone: sanitizedPhone,
        status: 'unclassified',
        tags: data.tags || [],
        source: 'manual_contact_page'
      })

    if (error) throw error

    revalidatePath('/dashboard/contactos')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 2. PROMOCIONAR CONTACTO A ALUMNO
 * Convierte un contacto en alumno activo con sede y precio.
 */
export async function promoteContactToStudent(contactId: string, data: {
  club_id: string;
  level: string;
  price_per_class: number;
}) {
  try {
    const supabase = await createSupabaseServerClient()

    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (fetchError) throw fetchError

    const priceCents = Math.round(data.price_per_class * 100)
    
    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert({
        full_name: contact.full_name,
        phone: contact.phone,
        club_id: data.club_id,
        level: data.level,
        price_per_class_cents: priceCents,
        active: true
      })
      .select()
      .single()

    if (studentError) throw studentError

    await supabase
      .from('contacts')
      .update({
        student_id: newStudent.id,
        status: 'student'
      })
      .eq('id', contactId)

    revalidatePath('/dashboard/contactos')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 3. ACTUALIZAR DATOS DE ALUMNO (Edición Completa)
 * Blindado contra club_id nulo y sincronización de horarios.
 */
export async function updateStudentData(studentId: string, data: {
  full_name: string;
  level: string;
  price_per_class: number; 
  club_id: string;
  schedules?: Array<{ day_of_week: number; start_time: string }>;
}) {
  try {
    const supabase = await createSupabaseServerClient()

    // VALIDACIÓN CRÍTICA: Evita que club_id llegue como null o string 'null'
    if (!data.club_id || data.club_id === 'null') {
      return { success: false, error: "La sede seleccionada no es válida." }
    }

    const priceCents = Math.round(data.price_per_class * 100)

    // A. Actualizamos la ficha principal del alumno
    const { error: studentError } = await supabase
      .from('students')
      .update({
        full_name: data.full_name,
        level: data.level,
        price_per_class_cents: priceCents,
        club_id: data.club_id
      })
      .eq('id', studentId)

    if (studentError) throw studentError

    // B. Sincronización de Agenda (Horarios)
    if (data.schedules && data.schedules.length > 0) {
      // Limpiamos horarios viejos para evitar duplicados
      await supabase.from('schedules').delete().eq('student_id', studentId)

      // Insertamos la nueva agenda asegurando que hereden el club_id correcto
      const scheduleInserts = data.schedules.map(s => {
        const start = s.start_time.includes(':00') ? s.start_time : `${s.start_time}:00`
        const hour = parseInt(start.split(':')[0])
        const end = `${(hour + 1).toString().padStart(2, '0')}:${start.split(':')[1]}:00`
        
        return {
          student_id: studentId,
          club_id: data.club_id,
          day_of_week: s.day_of_week,
          start_time: start,
          end_time: end
        }
      })
      
      const { error: scheduleError } = await supabase.from('schedules').insert(scheduleInserts)
      if (scheduleError) throw scheduleError
    } else {
      // Si no se enviaron horarios nuevos, al menos actualizamos la sede de los actuales
      await supabase
        .from('schedules')
        .update({ club_id: data.club_id })
        .eq('student_id', studentId)
    }

    revalidatePath('/dashboard/contactos')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Error en updateStudentData:", err.message)
    return { success: false, error: err.message }
  }
}

/**
 * 4. ELIMINAR CONTACTO
 * Eliminación física definitiva de la base de datos.
 */
export async function deleteContact(contactId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('contacts').delete().eq('id', contactId)

    if (error) throw error

    revalidatePath('/dashboard/contactos')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}