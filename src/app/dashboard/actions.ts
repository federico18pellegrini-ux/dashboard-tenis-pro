'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizePhone } from '@/lib/utils/phone'

/**
 * 1. ALTA DE ALUMNO MULTI-DÍA (Optimizado)
 * Registra alumno, contacto y agenda semanal en paralelo.
 */
export async function addManualStudent(input: {
  full_name: string;
  phone: string;
  level: string;
  price_per_class_cents: number;
  schedules: Array<{
    club_id: string;
    day_of_week: number;
    start_time: string;
  }>;
}) {
  try {
    const supabase = await createSupabaseServerClient()
    const sanitizedPhone = normalizePhone(input.phone)

    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        full_name: input.full_name,
        phone: sanitizedPhone,
        club_id: input.schedules[0]?.club_id, 
        level: input.level.toLowerCase(),
        price_per_class_cents: input.price_per_class_cents || 0,
        active: true
      })
      .select().single()

    if (studentError) throw new Error(studentError.message)

    const scheduleInserts = input.schedules.map(s => {
      const start = s.start_time.includes(':00') ? s.start_time : `${s.start_time}:00`
      const hour = parseInt(start.split(':')[0])
      const end = `${(hour + 1).toString().padStart(2, '0')}:${start.split(':')[1]}:00`
      
      return {
        student_id: student.id,
        club_id: s.club_id,
        day_of_week: s.day_of_week,
        start_time: start,
        end_time: end
      }
    })

    const [contactRes, scheduleRes] = await Promise.all([
      supabase.from('contacts').insert({
        full_name: input.full_name,
        phone: sanitizedPhone,
        status: 'student',
        student_id: student.id,
        source: 'dashboard_quick'
      }),
      supabase.from('schedules').insert(scheduleInserts)
    ])

    if (contactRes.error) throw contactRes.error
    if (scheduleRes.error) throw scheduleRes.error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/contactos')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 2. GESTIÓN DE PAGOS E INGRESOS
 */
export async function registerPayment(studentId: string, amountCents: number) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('payments').insert({
    student_id: studentId,
    amount_cents: amountCents,
    payment_date: new Date().toISOString(),
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/caja')
  return { success: true }
}

export async function deletePayment(studentId: string) {
  const supabase = await createSupabaseServerClient()
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { error } = await supabase.from('payments').delete().eq('student_id', studentId).gte('payment_date', firstDay)
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/caja')
  return { success: true }
}

/**
 * 3. GESTIÓN DE EGRESOS (Caja)
 */
export async function addExpense(input: {
  club_id?: string;
  amount_cents: number;
  category: string;
  description: string;
  paid_to: string;
  payment_method: string;
  expense_date: string;
}) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('expenses').insert(input)
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/caja')
  return { success: true }
}

export async function deleteExpense(id: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('expenses').delete().eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/caja')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 4. ELIMINACIÓN DE ALUMNOS Y CONTACTOS
 */
export async function deleteStudent(studentId: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('students').delete().eq('id', studentId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/contactos')
  return { success: true }
}

export async function deleteContact(contactId: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('contacts').delete().eq('id', contactId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/contactos')
  return { success: true }
}