import { z } from 'zod';

export const CheckoutAppointmentSchema = z.object({
  paymentMethod: z.enum(['CASH', 'CARD', 'GCASH']),
  discountAmount: z
    .number()
    .min(0, 'Discount amount must be non-negative.')
    .default(0),
  employeeId: z
    .string()
    .uuid('Invalid stylist ID.')
    .optional()
    .nullable(),
});
