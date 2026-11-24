import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { updateMemberSchema } from '../schemas/member';
import { HttpError } from '../utils/httpError';
import { getParam } from '../utils/params';

const memberSelect = {
  userId: true,
  role: true,
  user: { select: { name: true, email: true } },
} satisfies Prisma.ProjectMemberSelect;

function toPublicMember(member: {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  user: { name: string; email: string };
}) {
  return {
    userId: member.userId,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
  };
}

export async function listMembers(req: Request, res: Response): Promise<void> {
  const members = await prisma.projectMember.findMany({
    where: { projectId: getParam(req.params.id) },
    orderBy: { user: { name: 'asc' } },
    select: memberSelect,
  });

  res.json(members.map(toPublicMember));
}

export async function updateMember(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const targetId = getParam(req.params.userId);
  const { role } = updateMemberSchema.parse(req.body);

  const target = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetId } },
    select: { role: true },
  });

  if (!target) {
    throw new HttpError(404, 'Miembro no encontrado');
  }

  if (target.role === 'owner') {
    throw new HttpError(403, 'No se puede modificar al owner');
  }

  const member = await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId: targetId } },
    data: { role },
    select: memberSelect,
  });

  res.json({ member: toPublicMember(member) });
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const targetId = getParam(req.params.userId);
  const userId = req.userId;
  const actorRole = req.projectRole;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const target = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: targetId } },
    select: { role: true },
  });

  if (!target) {
    throw new HttpError(404, 'Miembro no encontrado');
  }

  if (target.role === 'owner') {
    throw new HttpError(403, 'No se puede quitar al owner');
  }

  if (userId !== targetId && actorRole !== 'owner') {
    throw new HttpError(403, 'Solo el owner puede quitar a otros miembros');
  }

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { projectId, assigneeId: targetId },
      data: { assigneeId: null },
    }),
    prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: targetId } },
    }),
  ]);

  res.status(204).end();
}
