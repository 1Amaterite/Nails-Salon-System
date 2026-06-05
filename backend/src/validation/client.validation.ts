import { z } from 'zod';

const phoneRegex = /^[0-9+\-\s().]{7,20}$/;

export const CreateClientSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required'),
  lastName: z
    .string()
    .trim()
    .default(''),
  phoneNumber: z
    .string()
    .trim()
    .regex(phoneRegex, 'Please enter a valid phone number (7-20 digits, spaces, +, -, parentheses)')
    .optional()
    .nullable()
    .or(z.literal('')),
  birthday: z
    .string()
    .trim()
    .datetime({ message: 'Birthday must be a valid ISO datetime string' })
    .optional()
    .nullable()
    .or(z.literal(''))
    .or(
      z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Birthday must be a valid date format',
      })
    ),
  notes: z
    .string()
    .trim()
    .optional()
    .nullable(),
});

export const UpdateClientSchema = CreateClientSchema.partial();
