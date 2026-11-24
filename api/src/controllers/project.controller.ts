import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { createProjectSchema, updateProjectSchema } from '../schemas/project';
import { decrypt, encrypt } from '../utils/crypto';
import { HttpError } from '../utils/httpError';
import { getParam } from '../utils/params';

const projectLinkSelect = {
  id: true,
  type: true,
  label: true,
  urlEncrypted: true,
} satisfies Prisma.ProjectLinkSelect;

const publicProjectSelect = {
  id: true,
  ownerId: true,
  name: true,
  subtitle: true,
  description: true,
  category: true,
  createdAt: true,
  links: { select: projectLinkSelect, orderBy: { label: 'asc' } },
  _count: { select: { tasks: { where: { done: false } } } },
} satisfies Prisma.ProjectSelect;

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

type SelectedProject = Prisma.ProjectGetPayload<{
  select: typeof publicProjectSelect;
}>;

function toPublicProject(
  project: SelectedProject,
  role: string | undefined,
  openTasks?: number,
) {
  const { _count, links, ...rest } = project;
  return {
    ...rest,
    role,
    openTasks: openTasks ?? _count.tasks,
    links: links.map(toPublicLink),
  };
}

export async function listProjects(req: Request, res: Response): Promise<void> {
  const userId = req.userId;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    orderBy: { project: { createdAt: 'desc' } },
    select: {
      role: true,
      project: { select: publicProjectSelect },
    },
  });

  const projects = memberships.map(({ role, project }) =>
    toPublicProject(project, role),
  );

  res.json(projects);
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const userId = req.userId;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const { name, subtitle, description, category, links } =
    createProjectSchema.parse(req.body);

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        name,
        subtitle,
        description,
        category,
        ownerId: userId,
      },
      select: { id: true },
    });

    await tx.projectMember.create({
      data: { projectId: created.id, userId, role: 'owner' },
    });

    if (links?.length) {
      await tx.projectLink.createMany({
        data: links.map((link) => ({
          projectId: created.id,
          type: link.type,
          label: link.label,
          urlEncrypted: encrypt(link.url),
        })),
      });
    }

    return tx.project.findUniqueOrThrow({
      where: { id: created.id },
      select: publicProjectSelect,
    });
  });

  res.status(201).json({
    project: toPublicProject(project, 'owner', 0),
  });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: getParam(req.params.id) },
    select: publicProjectSelect,
  });

  if (!project) {
    throw new HttpError(404, 'Proyecto no encontrado');
  }

  res.json({ project: toPublicProject(project, req.projectRole) });
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const data = updateProjectSchema.parse(req.body);

  const project = await prisma.project.update({
    where: { id: getParam(req.params.id) },
    data,
    select: publicProjectSelect,
  });

  res.json({ project: toPublicProject(project, req.projectRole) });
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  await prisma.project.delete({ where: { id: getParam(req.params.id) } });
  res.status(204).end();
}
