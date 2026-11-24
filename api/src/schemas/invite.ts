import { z } from 'zod';

export const inviteRoleSchema = z.enum(['editor', 'viewer']);

export const expiresInDaysSchema = z
  .union([z.literal(1), z.literal(7), z.literal(30)])
  .default(7);

export const maxUsesSchema = z.number().int().min(1).max(10).default(1);

export const createInviteSchema = z.object({
  role: inviteRoleSchema,
  expiresInDays: expiresInDaysSchema,
  maxUses: maxUsesSchema,
});
