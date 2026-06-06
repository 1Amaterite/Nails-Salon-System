import { z } from 'zod';

const phoneRegex = /^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$/;

export const JoinWaitlistSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required.'),
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
});
