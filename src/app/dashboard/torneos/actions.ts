'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function createTournament(formData: FormData) {
  try {
    const supabase = await createSupabaseServerClient()
    const name = String(formData.get('name') || '').trim()
    const start_date = String(formData.get('start_date') || '').trim()
    const end_date = String(formData.get('end_date') || '').trim()
    const notesRaw = formData.get('notes')
    const notes = notesRaw ? String(notesRaw) : null

    if (!name) throw new Error('Nombre requerido')
    if (!start_date) throw new Error('Fecha inicio requerida')
    if (!end_date) throw new Error('Fecha fin requerida')

    const { data, error } = await supabase
      .from('tournaments')
      .insert({ name, start_date, end_date, notes, status: 'upcoming' })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/dashboard/torneos')
    return { success: true, id: data?.id as string }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Error' }
  }
}

export async function addCategory(tournamentId: string, name: string, clubId: string, priceCents: number) {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('tournament_categories').insert({
      tournament_id: tournamentId,
      name,
      club_id: clubId,
      price_cents: priceCents,
    })
    if (error) throw error

    revalidatePath('/dashboard/torneos')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Error' }
  }
}

export async function addStudentToTournament(tournamentId: string, studentId: string, categoryId: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('tournament_students').insert({
      tournament_id: tournamentId,
      student_id: studentId,
      category_id: categoryId,
      payment_status: 'pending',
    })
    if (error) throw error

    revalidatePath('/dashboard/torneos')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Error' }
  }
}

export async function registerTournamentPayment(tournamentId: string, studentId: string, method: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase
      .from('tournament_students')
      .update({
        payment_status: 'paid',
        payment_method: method,
        paid_at: new Date().toISOString(),
      })
      .eq('tournament_id', tournamentId)
      .eq('student_id', studentId)

    if (error) throw error

    revalidatePath('/dashboard/torneos')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Error' }
  }
}

export async function deleteTournament(id: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('tournaments').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/dashboard/torneos')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Error' }
  }
}

export async function updateTournamentStatus(id: string, status: string) {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('tournaments').update({ status }).eq('id', id)
    if (error) throw error

    revalidatePath('/dashboard/torneos')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Error' }
  }
}

