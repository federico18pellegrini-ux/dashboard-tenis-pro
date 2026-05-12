'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CreateClassSchema } from '@/lib/schemas/classes'
import { z } from 'zod'

function minutesFromHHMM(hhmm: string) {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10))
  return h * 60 + m
}

export async function createClass(formData: unknown) {
  try {
    const input = CreateClassSchema.parse(formData)
    const supabase = await createSupabaseServerClient()

    const duration_minutes = minutesFromHHMM(input.end_time) - minutesFromHHMM(input.start_time)
    if (duration_minutes <= 0) {
      return { success: false as const, error: 'La duración debe ser mayor a 0.' }
    }

    const scheduled_at = new Date(`${input.scheduled_date}T${input.start_time}:00`).toISOString()

    const { data: inserted, error: classErr } = await supabase
      .from('classes')
      .insert({
        club_id: input.club_id,
        scheduled_at,
        duration_minutes,
        price_cents: input.price_cents,
        status: 'scheduled',
      })
      .select('id')
      .single()

    if (classErr) throw classErr
    if (!inserted?.id) return { success: false as const, error: 'No se pudo crear la clase.' }

    const junctionRows = input.student_ids.map((student_id) => ({
      class_id: inserted.id,
      student_id,
    }))

    const { error: junctionErr } = await supabase.from('class_students').insert(junctionRows)
    if (junctionErr) {
      // rollback best-effort
      await supabase.from('classes').delete().eq('id', inserted.id)
      throw junctionErr
    }

    revalidatePath('/dashboard')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

const UpdateClassStatusSchema = z.object({
  class_id: z.string().uuid(),
  status: z.enum(['scheduled', 'completed', 'cancelled']),
})

export async function updateClassStatus(data: unknown) {
  try {
    const input = UpdateClassStatusSchema.parse(data)
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('classes')
      // Bypass del schema cache / tipos generados de Supabase que modelan status como enum.
      .update({ status: input.status } as any)
      .eq('id', input.class_id)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

const MarkStudentAttendanceSchema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
  attendance: z.enum(['pending', 'attended', 'no_show']),
})

export async function markStudentAttendance(data: unknown) {
  try {
    const input = MarkStudentAttendanceSchema.parse(data)
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('class_students')
      .update({ attendance: input.attendance } as any)
      .eq('class_id', input.class_id)
      .eq('student_id', input.student_id)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

const AddStudentToClassSchema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
})

export async function addStudentToClass(data: unknown) {
  try {
    const input = AddStudentToClassSchema.parse(data)
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.from('class_students').insert({
      class_id: input.class_id,
      student_id: input.student_id,
      paid: false,
    })

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

const DeleteClassSchema = z.object({
  class_id: z.string().uuid(),
})

export async function deleteClass(data: unknown) {
  try {
    const input = DeleteClassSchema.parse(data)
    const supabase = await createSupabaseServerClient()

    const { error: junctionErr } = await supabase.from('class_students').delete().eq('class_id', input.class_id)
    if (junctionErr) throw junctionErr

    const { error: classErr } = await supabase.from('classes').delete().eq('id', input.class_id)
    if (classErr) throw classErr

    revalidatePath('/dashboard')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

export async function listAvailableClassesForStudent(data: unknown) {
  const Schema = z.object({
    student_id: z.string().uuid(),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(3000).optional(),
  })

  try {
    const input = Schema.parse(data)
    const supabase = await createSupabaseServerClient()

    const now = new Date()
    const month = input.month ?? now.getMonth() + 1
    const year = input.year ?? now.getFullYear()

    const startOfMonth = new Date(year, month - 1, 1)
    startOfMonth.setHours(0, 0, 0, 0)
    const endOfMonth = new Date(year, month, 0)
    endOfMonth.setHours(23, 59, 59, 999)

    const { data: classes, error: classesErr } = await supabase
      .from('classes')
      .select(`id, scheduled_at, duration_minutes, status, club:clubs(name)`)
      .gte('scheduled_at', startOfMonth.toISOString())
      .lte('scheduled_at', endOfMonth.toISOString())
      .order('scheduled_at', { ascending: true })

    if (classesErr) throw classesErr

    const { data: existing, error: existingErr } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', input.student_id)

    if (existingErr) throw existingErr

    const existingIds = new Set((existing ?? []).map((r: any) => r.class_id))
    const available = (classes ?? []).filter((c: any) => !existingIds.has(c.id))

    return { success: true as const, classes: available }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

