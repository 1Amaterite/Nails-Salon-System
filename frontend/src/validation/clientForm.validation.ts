import { z } from 'zod';
import { PHONE_REGEX, PHONE_TITLE } from '../utils/validation';

export const ClientFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().optional(),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .regex(PHONE_REGEX, PHONE_TITLE),
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
