import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { createInviteSchema } from '../schemas/invite';
import { HttpError } from '../utils/httpError';
import { getParam } from '../utils/params';

const INVALID_INVITE = 'Invitación inválida o vencida';
const DAY_MS = 24 * 60 * 60 * 1000;

const inviteSelect = {
  id: true,
  role: true,
  expiresAt: true,
  maxUses: true,
  uses: true,
  createdAt: true,
} satisfies Prisma.InviteLinkSelect;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isInviteUsable(invite: {
  revokedAt: Date | null;
  expiresAt: Date;
  uses: number;
  maxUses: number;
}): boolean {
  return (
    invite.revokedAt === null &&
    invite.expiresAt.getTime() > Date.now() &&
    invite.uses < invite.maxUses
  );
}

function clientBaseUrl(): string {
  return (process.env.CLIENT_URL ?? '').replace(/\/$/, '');
}

export async function listInvites(req: Request, res: Response): Promise<void> {
  const invites = await prisma.inviteLink.findMany({
    where: {
      projectId: getParam(req.params.id),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    select: inviteSelect,
  });

  res.json(invites.filter((invite) => invite.uses < invite.maxUses));
}

export async function createInvite(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const userId = req.userId;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const { role, expiresInDays, maxUses } = createInviteSchema.parse(req.body);

  // The plain token is returned exactly once and never stored or logged.
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + expiresInDays * DAY_MS);

  const invite = await prisma.inviteLink.create({
    data: {
      projectId,
      tokenHash: hashToken(token),
      role,
      expiresAt,
      maxUses,
      createdBy: userId,
    },
    select: inviteSelect,
  });

  res.status(201).json({
    id: invite.id,
    role: invite.role,
    expiresAt: invite.expiresAt,
    maxUses: invite.maxUses,
    url: `${clientBaseUrl()}/invite/${token}`,
  });
}

export async function revokeInvite(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const inviteId = getParam(req.params.inviteId);

  const existing = await prisma.inviteLink.findFirst({
    where: { id: inviteId, projectId },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Invitación no encontrada');
  }

  await prisma.inviteLink.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  res.status(204).end();
}

/** Public endpoint: only exposes what the invite landing page needs. */
export async function getInvite(req: Request, res: Response): Promise<void> {
  const tokenHash = hashToken(getParam(req.params.token));

  const invite = await prisma.inviteLink.findUnique({
    where: { tokenHash },
    select: {
      ...inviteSelect,
      revokedAt: true,
      project: { select: { name: true } },
      creator: { select: { name: true } },
    },
  });

  if (!invite || !isInviteUsable(invite)) {
    throw new HttpError(404, INVALID_INVITE);
  }

  res.json({
    projectName: invite.project.name,
    role: invite.role,
    invitedBy: invite.creator.name,
  });
}

export async function acceptInvite(req: Request, res: Response): Promise<void> {
  const userId = req.userId;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const tokenHash = hashToken(getParam(req.params.token));

  const invite = await prisma.inviteLink.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      projectId: true,
      role: true,
      expiresAt: true,
      maxUses: true,
      uses: true,
      revokedAt: true,
    },
  });

  if (!invite || !isInviteUsable(invite)) {
    throw new HttpError(404, INVALID_INVITE);
  }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: invite.projectId, userId } },
    select: { role: true },
  });

  if (existing) {
    res.json({ projectId: invite.projectId, alreadyMember: true });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Atomic consumption: only one concurrent accept can take the last use.
      const consumed = await tx.inviteLink.updateMany({
        where: {
          id: invite.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          uses: { lt: invite.maxUses },
        },
        data: { uses: { increment: 1 } },
      });

      if (consumed.count === 0) {
        throw new HttpError(404, INVALID_INVITE);
      }

      await tx.projectMember.create({
        data: { projectId: invite.projectId, userId, role: invite.role },
      });
    });
  } catch (error) {
    // Two accepts racing for the same user: the membership already exists.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      res.json({ projectId: invite.projectId, alreadyMember: true });
      return;
    }
    throw error;
  }

  res.json({ projectId: invite.projectId, role: invite.role });
}
