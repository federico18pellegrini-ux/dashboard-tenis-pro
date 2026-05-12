'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { RegisterClassPaymentSchema } from '@/lib/schemas/payments'
import { z } from 'zod'

export async function registerClassPayment(data: unknown) {
  try {
    const input = RegisterClassPaymentSchema.parse(data)
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('class_students')
      .update({
        paid: true,
        paid_amount: input.amount_cents,
        paid_at: new Date().toISOString(),
        payment_method: input.payment_method,
      })
      .eq('class_id', input.class_id)
      .eq('student_id', input.student_id)

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/caja')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

const CancelClassPaymentSchema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
})

export async function cancelClassPayment(data: unknown) {
  try {
    const input = CancelClassPaymentSchema.parse(data)
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('class_students')
      .update({
        paid: false,
        paid_amount: null,
        paid_at: null,
        payment_method: null,
      })
      .eq('class_id', input.class_id)
      .eq('student_id', input.student_id)

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/caja')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}

const DeleteTournamentPaymentSchema = z.object({
  payment_id: z.string().uuid(),
})

export async function deleteTournamentPayment(data: unknown) {
  try {
    const input = DeleteTournamentPaymentSchema.parse(data)
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', input.payment_id)
      .eq('type', 'tournament')

    if (error) throw error

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/caja')
    return { success: true as const }
  } catch (err: any) {
    return { success: false as const, error: err?.message ?? 'Error inesperado.' }
  }
}
