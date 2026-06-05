import { z } from 'zod';

const phoneRegex = /^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$/;

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
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Phone number must be in the format 09xx xxx xxxx or 09xxxxxxxxx'),
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
