'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  AssignContactToSlotSchema,
  type AssignContactToSlotInput,
  CreateScheduleSlotSchema,
  type CreateScheduleSlotInput,
  DeleteScheduleSlotSchema,
  type DeleteScheduleSlotInput,
  UpdateScheduleSlotSchema,
  type UpdateScheduleSlotInput,
} from '@/lib/schemas/schedules'

function toTimeWithSeconds(hhmm: string) {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm
}

function addMinutesToHHMM(hhmm: string, minutesToAdd: number) {
  const [hh, mm] = hhmm.split(':').map((n) => parseInt(n, 10))
  const total = hh * 60 + mm + minutesToAdd
  const outH = Math.floor((total % (24 * 60)) / 60)
  const outM = total % 60
  return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`
}

export async function assignContactToSlot(input: AssignContactToSlotInput) {
  const { contactId, dayOfWeek, startTime, clubId } = AssignContactToSlotSchema.parse(input)
  const supabase = await createSupabaseServerClient()

  try {
    const { data: contact, error: contactErr } = await supabase
      .from('contacts')
      .select('id, full_name, phone, status, student_id')
      .eq('id', contactId)
      .single()

    if (contactErr) throw contactErr
    if (!contact) return { success: false as const, error: 'Contacto no encontrado.' }

    const startHHMM = startTime
    const endHHMM = addMinutesToHHMM(startHHMM, 60)

    const scheduleRow = {
      club_id: clubId,
      day_of_week: dayOfWeek,
      start_time: toTimeWithSeconds(startHHMM),
      end_time: toTimeWithSeconds(endHHMM),
    }

    // Chequear slot duplicado (mismo club + día + hora ya ocupado)
    const { data: existing, error: existingErr } = await supabase
      .from('schedules')
      .select('id')
      .eq('club_id', clubId)
      .eq('day_of_week', dayOfWeek)
      .eq('start_time', toTimeWithSeconds(startTime))
      .maybeSingle()
    if (existingErr) throw existingErr
    if (existing) {
      return {
        success: false as const,
        error: 'Ese horario ya tiene un alumno asignado.',
      }
    }

    // CASE A: contacto unclassified → crear student + update contact + insert schedule
    if (contact.status === 'unclassified') {
      const { data: newStudent, error: studentErr } = await supabase
        .from('students')
        .insert({
          full_name: contact.full_name,
          phone: contact.phone,
          club_id: clubId,
          level: 'principiante',
          price_per_class_cents: 0,
          active: true,
        })
        .select('id')
        .single()

      if (studentErr) throw studentErr
      if (!newStudent?.id) return { success: false as const, error: 'No se pudo crear el alumno.' }

      const { error: updateContactErr } = await supabase
        .from('contacts')
        .update({ status: 'student', student_id: newStudent.id })
        .eq('id', contact.id)

      if (updateContactErr) {
        await supabase.from('students').delete().eq('id', newStudent.id)
        throw updateContactErr
      }

      const { error: scheduleErr } = await supabase
        .from('schedules')
        .insert({
          student_id: newStudent.id,
          ...scheduleRow,
        })

      if (scheduleErr) {
        await supabase.from('contacts').update({ status: 'unclassified', student_id: null }).eq('id', contact.id)
        await supabase.from('students').delete().eq('id', newStudent.id)
        throw scheduleErr
      }

      revalidatePath('/dashboard/contactos')
      revalidatePath('/dashboard')
      return { success: true as const, studentId: newStudent.id }
    }

    // CASE B: contacto ya es student → insertar schedule (sin tocar students.club_id)
    if (contact.status === 'student') {
      const studentId = contact.student_id
      if (!studentId) {
        return { success: false as const, error: 'Contacto en estado student pero sin student_id.' }
      }

      const { error: scheduleErr } = await supabase
        .from('schedules')
        .insert({
          student_id: studentId,
          ...scheduleRow,
        })

      if (scheduleErr) throw scheduleErr

      revalidatePath('/dashboard')
      return { success: true as const, studentId }
    }

    return { success: false as const, error: 'Estado de contacto no soportado para asignación.' }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

export async function updateScheduleSlot(input: UpdateScheduleSlotInput) {
  const { scheduleId, dayOfWeek, startTime, clubId } = UpdateScheduleSlotSchema.parse(input)
  const supabase = await createSupabaseServerClient()

  try {
    const { data: existing, error: existingErr } = await supabase
      .from('schedules')
      .select('id')
      .eq('club_id', clubId)
      .eq('day_of_week', dayOfWeek)
      .eq('start_time', toTimeWithSeconds(startTime))
      .neq('id', scheduleId)
      .maybeSingle()
    if (existingErr) throw existingErr
    if (existing) {
      return {
        success: false as const,
        error: 'Ya hay otro alumno en ese horario.',
      }
    }

    const endHHMM = addMinutesToHHMM(startTime, 60)

    const { error } = await supabase
      .from('schedules')
      .update({
        club_id: clubId,
        day_of_week: dayOfWeek,
        start_time: toTimeWithSeconds(startTime),
        end_time: toTimeWithSeconds(endHHMM),
      })
      .eq('id', scheduleId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

export async function deleteScheduleSlot(input: DeleteScheduleSlotInput) {
  const { scheduleId } = DeleteScheduleSlotSchema.parse(input)
  const supabase = await createSupabaseServerClient()

  try {
    const { error } = await supabase.from('schedules').delete().eq('id', scheduleId)
    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

export async function createScheduleSlot(input: CreateScheduleSlotInput) {
  const { studentId, dayOfWeek, startTime, clubId } = CreateScheduleSlotSchema.parse(input)
  const supabase = await createSupabaseServerClient()

  try {
    // Chequear duplicado (mismo club + día + hora)
    const { data: existing, error: existingErr } = await supabase
      .from('schedules')
      .select('id')
      .eq('club_id', clubId)
      .eq('day_of_week', dayOfWeek)
      .eq('start_time', toTimeWithSeconds(startTime))
      .maybeSingle()
    if (existingErr) throw existingErr
    if (existing) {
      return {
        success: false as const,
        error: 'Ese horario ya tiene un alumno asignado.',
      }
    }

    const endHHMM = addMinutesToHHMM(startTime, 60)

    const { error } = await supabase.from('schedules').insert({
      student_id: studentId,
      club_id: clubId,
      day_of_week: dayOfWeek,
      start_time: toTimeWithSeconds(startTime),
      end_time: toTimeWithSeconds(endHHMM),
    })
    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}
