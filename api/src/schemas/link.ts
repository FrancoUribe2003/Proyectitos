import { z } from 'zod';

const linkTypeSchema = z.enum(['front', 'back', 'repo', 'db', 'other']);

const urlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'La URL debe ser http o https' },
  );

export const createLinkSchema = z.object({
  type: linkTypeSchema.default('other'),
  label: z.string().trim().min(1).max(60),
  url: urlSchema,
});

export const updateLinkSchema = z.object({
  type: linkTypeSchema.optional(),
  label: z.string().trim().min(1).max(60).optional(),
  url: urlSchema.optional(),
});
