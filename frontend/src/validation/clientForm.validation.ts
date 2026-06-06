import { z } from 'zod';

const phoneRegex = /^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$/;

export const ClientFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().optional(),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .regex(phoneRegex, 'Phone number must be in format 09xxxxxxxxx or 09xx xxx xxxx.'),
  birthday: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Birthday must be a valid date.',
    }),
  safetyNotes: z.string().optional(),
  techPreferences: z.string().optional(),
  generalNotes: z.string().optional(),
});
export type ClientFormValues = z.infer<typeof ClientFormSchema>;
