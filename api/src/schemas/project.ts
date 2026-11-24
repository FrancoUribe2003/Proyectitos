import { z } from 'zod';
import { createLinkSchema } from './link';

export const categorySchema = z.enum(['personal', 'trabajo']);

/**
 * Campos de texto opcionales para crear: `undefined`, `null` o `""` se
 * normalizan a `null`, así el cliente puede mandar el formulario tal cual
 * (con los campos vacíos) sin que la validación falle.
 */
const createText = (max: number, label: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value == null) {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((value) => value === null || value.length <= max, {
      message: `${label}: máximo ${max} caracteres`,
    });

/**
 * Igual que `createText`, pero para PATCH: si el campo no viene en el body
 * queda `undefined` (y Prisma no lo toca). `null` o `""` sí lo limpian.
 */
const updateText = (max: number, label: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (value === null) {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((value) => value == null || value.length <= max, {
      message: `${label}: máximo ${max} caracteres`,
    });

/** Tolera `null` (o ausencia) y cae en `personal`. */
const categoryInput = z.preprocess(
  (value) => (value == null ? 'personal' : value),
  categorySchema,
);

/**
 * Descarta links vacíos (url o label en blanco) antes de validar, así una
 * fila de link que el usuario dejó sin completar no rompe la creación.
 */
const projectLinksInput = z.preprocess(
  (value) => {
    if (!Array.isArray(value)) {
      return value;
    }
    return value.filter((item) => {
      if (!item || typeof item !== 'object') {
        return false;
      }
      const { url, label } = item as { url?: unknown; label?: unknown };
      return (
        (typeof url !== 'string' || url.trim().length > 0) &&
        (typeof label !== 'string' || label.trim().length > 0)
      );
    });
  },
  z.array(createLinkSchema).max(10).optional(),
);

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  subtitle: createText(120, 'Subtítulo'),
  description: createText(2000, 'Descripción'),
  category: categoryInput,
  links: projectLinksInput,
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  subtitle: updateText(120, 'Subtítulo'),
  description: updateText(2000, 'Descripción'),
  category: categorySchema.optional(),
});
