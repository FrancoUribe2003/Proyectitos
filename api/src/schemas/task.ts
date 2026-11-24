import { z } from 'zod';

export const listTasksQuerySchema = z.object({
  assignee: z.string().trim().min(1).optional(),
  done: z.enum(['true', 'false']).optional(),
});

/** Acepta `null`, ausencia o texto vacío y lo normaliza a `null`. */
const descriptionSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  })
  .refine((value) => value === null || value.length <= 2000, {
    message: 'Descripción: máximo 2000 caracteres',
  });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: descriptionSchema,
  assigneeId: z.string().trim().min(1).nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: descriptionSchema.optional(),
  done: z.boolean().optional(),
  assigneeId: z.string().trim().min(1).nullable().optional(),
});
