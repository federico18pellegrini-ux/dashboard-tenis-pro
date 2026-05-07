import { z } from 'zod'

const HHMM = /^\d{2}:\d{2}$/
const YYYYMMDD = /^\d{4}-\d{2}-\d{2}$/

export const CreateClassSchema = z
  .object({
    club_id: z.string().uuid(),
    scheduled_date: z.string().regex(YYYYMMDD),
    start_time: z.string().regex(HHMM),
    end_time: z.string().regex(HHMM),
    student_ids: z.array(z.string().uuid()).min(1),
    price_cents: z.number().int().positive(),
  })
  .superRefine((v, ctx) => {
    const [sh, sm] = v.start_time.split(':').map(Number)
    const [eh, em] = v.end_time.split(':').map(Number)
    const start = sh * 60 + sm
    const end = eh * 60 + em
    if (!(end > start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'end_time debe ser mayor a start_time',
      })
    }
  })

export type CreateClassInput = z.infer<typeof CreateClassSchema>

