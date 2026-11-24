import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import {
  createTaskSchema,
  listTasksQuerySchema,
  updateTaskSchema,
} from '../schemas/task';
import { HttpError } from '../utils/httpError';
import { getParam } from '../utils/params';

const taskSelect = {
  id: true,
  title: true,
  description: true,
  done: true,
  createdAt: true,
  assignee: { select: { id: true, name: true } },
} satisfies Prisma.TaskSelect;

function buildFilters(query: { assignee?: string; done?: 'true' | 'false' }) {
  const assigneeId = query.assignee === 'unassigned' ? null : query.assignee;

  return {
    ...(assigneeId !== undefined ? { assigneeId } : {}),
    ...(query.done !== undefined ? { done: query.done === 'true' } : {}),
  };
}

async function ensureAssigneeIsMember(projectId: string, assigneeId: string): Promise<void> {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
    select: { userId: true },
  });

  if (!membership) {
    throw new HttpError(400, 'El asignado no es miembro del proyecto');
  }
}

export async function listTasks(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const query = listTasksQuerySchema.parse(req.query);

  const tasks = await prisma.task.findMany({
    where: { projectId, ...buildFilters(query) },
    orderBy: [{ done: 'asc' }, { createdAt: 'asc' }],
    select: taskSelect,
  });

  res.json(tasks);
}

export async function exportTasksMarkdown(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const query = listTasksQuerySchema.parse(req.query);

  const [project, tasks] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    }),
    prisma.task.findMany({
      where: { projectId, ...buildFilters(query) },
      orderBy: [{ done: 'asc' }, { createdAt: 'asc' }],
      select: {
        title: true,
        done: true,
        assignee: { select: { name: true } },
      },
    }),
  ]);

  if (!project) {
    throw new HttpError(404, 'Proyecto no encontrado');
  }

  const lines = tasks.map((task) => {
    const title = task.title.replace(/[\r\n]+/g, ' ');
    const assignee = task.assignee ? ` (@${task.assignee.name})` : '';
    return `- [${task.done ? 'x' : ' '}] ${title}${assignee}`;
  });

  const markdown = `# ${project.name} — TODO\n\n${lines.join('\n')}${lines.length > 0 ? '\n' : ''}`;

  const slug =
    project.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'proyecto';

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${slug}-todo.md"`);
  res.send(markdown);
}

export async function createTask(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const userId = req.userId;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const { title, description, assigneeId } = createTaskSchema.parse(req.body);

  if (assigneeId) {
    await ensureAssigneeIsMember(projectId, assigneeId);
  }

  const task = await prisma.task.create({
    data: { projectId, title, description, assigneeId, createdBy: userId },
    select: taskSelect,
  });

  res.status(201).json({ task });
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const taskId = getParam(req.params.taskId);
  const data = updateTaskSchema.parse(req.body);

  const existing = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Task no encontrada');
  }

  if (data.assigneeId) {
    await ensureAssigneeIsMember(projectId, data.assigneeId);
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      description: data.description,
      done: data.done,
      assigneeId: data.assigneeId,
    },
    select: taskSelect,
  });

  res.json({ task });
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const taskId = getParam(req.params.taskId);

  const existing = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Task no encontrada');
  }

  await prisma.task.delete({ where: { id: existing.id } });

  res.status(204).end();
}
