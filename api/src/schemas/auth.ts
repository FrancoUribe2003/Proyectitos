import { z } from 'zod';

const emailSchema = z.email().trim().toLowerCase();

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100),
  name: z.string().trim().min(1).max(60),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
