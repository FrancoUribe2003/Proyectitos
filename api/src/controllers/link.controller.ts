import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { createLinkSchema, updateLinkSchema } from '../schemas/link';
import { decrypt, encrypt } from '../utils/crypto';
import { HttpError } from '../utils/httpError';
import { getParam } from '../utils/params';

const linkSelect = {
  id: true,
  type: true,
  label: true,
  urlEncrypted: true,
} satisfies Prisma.ProjectLinkSelect;

function toPublicLink(link: {
  id: string;
  type: 'front' | 'back' | 'repo' | 'db' | 'other';
  label: string;
  urlEncrypted: string;
}) {
  return {
    id: link.id,
    type: link.type,
    label: link.label,
    url: decrypt(link.urlEncrypted),
  };
}

export async function listLinks(req: Request, res: Response): Promise<void> {
  const links = await prisma.projectLink.findMany({
    where: { projectId: getParam(req.params.id) },
    orderBy: { label: 'asc' },
    select: linkSelect,
  });

  res.json(links.map(toPublicLink));
}

export async function createLink(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const { type, label, url } = createLinkSchema.parse(req.body);

  const link = await prisma.projectLink.create({
    data: { projectId, type, label, urlEncrypted: encrypt(url) },
    select: linkSelect,
  });

  res.status(201).json({ link: toPublicLink(link) });
}

export async function updateLink(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const linkId = getParam(req.params.linkId);
  const data = updateLinkSchema.parse(req.body);

  const existing = await prisma.projectLink.findFirst({
    where: { id: linkId, projectId },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Link no encontrado');
  }

  const link = await prisma.projectLink.update({
    where: { id: existing.id },
    data: {
      type: data.type,
      label: data.label,
      urlEncrypted: data.url !== undefined ? encrypt(data.url) : undefined,
    },
    select: linkSelect,
  });

  res.json({ link: toPublicLink(link) });
}

export async function deleteLink(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const linkId = getParam(req.params.linkId);

  const existing = await prisma.projectLink.findFirst({
    where: { id: linkId, projectId },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Link no encontrado');
  }

  await prisma.projectLink.delete({ where: { id: existing.id } });

  res.status(204).end();
}
