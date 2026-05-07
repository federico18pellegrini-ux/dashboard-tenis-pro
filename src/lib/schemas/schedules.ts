import { z } from 'zod'

export const AssignContactToSlotSchema = z.object({
  contactId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clubId: z.string().uuid(),
})
export type AssignContactToSlotInput = z.infer<typeof AssignContactToSlotSchema>

export const UpdateScheduleSlotSchema = z.object({
  scheduleId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clubId: z.string().uuid(),
})
export type UpdateScheduleSlotInput = z.infer<typeof UpdateScheduleSlotSchema>

export const DeleteScheduleSlotSchema = z.object({
  scheduleId: z.string().uuid(),
})
export type DeleteScheduleSlotInput = z.infer<typeof DeleteScheduleSlotSchema>

export const CreateScheduleSlotSchema = z.object({
  studentId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clubId: z.string().uuid(),
})
export type CreateScheduleSlotInput = z.infer<typeof CreateScheduleSlotSchema>
