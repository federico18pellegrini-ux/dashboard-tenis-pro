'use server'

import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const SlotSchema = z.object({
  club_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  active: z.boolean(),
})

const SaveAvailabilitySchema = z.object({
  slots: z.array(SlotSchema),
})

export type SaveAvailabilityInput = z.infer<typeof SaveAvailabilitySchema>

export async function saveAvailability(input: SaveAvailabilityInput) {
  const data = SaveAvailabilitySchema.parse(input)
  const supabase = await createSupabaseServerClient()

  const rows = data.slots.map((s) => ({
    club_id: s.club_id,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    duration_minutes: 60,
    active: s.active,
  }))

  const { error } = await supabase.from('availability_slots').upsert(rows, {
    onConflict: 'club_id,day_of_week,start_time',
  })

  if (error) return { success: false as const, error: error.message }

  revalidatePath('/dashboard/disponibilidad')
  revalidatePath('/dashboard')
  return { success: true as const }
}

