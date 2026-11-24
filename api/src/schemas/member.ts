import { z } from 'zod';

export const memberRoleSchema = z.enum(['editor', 'viewer']);

export const updateMemberSchema = z.object({
  role: memberRoleSchema,
});
