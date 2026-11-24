import { z } from 'zod';

export const createNoteSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  isPublic: z.boolean().default(false),
});

export const updateNoteSchema = z.object({
  content: z.string().trim().min(1).max(10000).optional(),
  isPublic: z.boolean().optional(),
});
