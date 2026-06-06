import { z } from 'zod';

const phoneRegex = /^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$/;

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

export const CreateAppointmentSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required.'),
  lastName: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .regex(phoneRegex, 'Phone number must be in the format 09xx xxx xxxx or 09xxxxxxxxx.'),
  serviceId: z
    .string()
    .uuid('Invalid service ID.'),
  employeeId: z
    .string()
    .uuid('Invalid stylist ID.')
    .optional()
    .nullable()
    .or(z.literal('')),
  date: z
    .string()
    .trim()
    .min(1, 'Appointment date is required.')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Date must be a valid date format.',
    }),
  startTime: z
    .string()
    .trim()
    .min(1, 'Start time is required.')
    .regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format.'),
});
