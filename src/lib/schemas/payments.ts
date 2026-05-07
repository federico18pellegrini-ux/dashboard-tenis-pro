import { z } from 'zod'

export const RegisterClassPaymentSchema = z.object({
  class_id: z.string().uuid(),
  student_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  payment_method: z.enum(['cash', 'transfer', 'mp']),
})

export type RegisterClassPaymentInput = z.infer<typeof RegisterClassPaymentSchema>

