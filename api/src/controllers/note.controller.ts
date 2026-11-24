import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import { createNoteSchema, updateNoteSchema } from '../schemas/note';
import { decrypt, encrypt } from '../utils/crypto';
import { HttpError } from '../utils/httpError';
import { getParam } from '../utils/params';

const noteSelect = {
  id: true,
  contentEncrypted: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author: { select: { id: true, name: true } },
} satisfies Prisma.NoteSelect;

function toPublicNote(
  note: {
    id: string;
    contentEncrypted: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    author: { id: string; name: string };
  },
  userId: string,
) {
  return {
    id: note.id,
    content: decrypt(note.contentEncrypted),
    isPublic: note.isPublic,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    author: note.author,
    isMine: note.authorId === userId,
  };
}

export async function listNotes(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const userId = req.userId;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const notes = await prisma.note.findMany({
    where: {
      projectId,
      OR: [{ isPublic: true }, { authorId: userId }],
    },
    orderBy: { createdAt: 'desc' },
    select: noteSelect,
  });

  res.json(notes.map((note) => toPublicNote(note, userId)));
}

export async function createNote(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const userId = req.userId;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const { content, isPublic } = createNoteSchema.parse(req.body);

  const note = await prisma.note.create({
    data: {
      projectId,
      authorId: userId,
      contentEncrypted: encrypt(content),
      isPublic,
    },
    select: noteSelect,
  });

  res.status(201).json({ note: toPublicNote(note, userId) });
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const noteId = getParam(req.params.noteId);
  const userId = req.userId;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const data = updateNoteSchema.parse(req.body);

  const existing = await prisma.note.findFirst({
    where: { id: noteId, projectId },
    select: { id: true, authorId: true, isPublic: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Nota no encontrada');
  }

  if (existing.authorId !== userId) {
    if (!existing.isPublic) {
      throw new HttpError(404, 'Nota no encontrada');
    }
    throw new HttpError(403, 'Solo el autor puede editar la nota');
  }

  const note = await prisma.note.update({
    where: { id: existing.id },
    data: {
      contentEncrypted: data.content !== undefined ? encrypt(data.content) : undefined,
      isPublic: data.isPublic,
    },
    select: noteSelect,
  });

  res.json({ note: toPublicNote(note, userId) });
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  const projectId = getParam(req.params.id);
  const noteId = getParam(req.params.noteId);
  const userId = req.userId;

  if (!userId) {
    throw new HttpError(401, 'No autenticado');
  }

  const existing = await prisma.note.findFirst({
    where: { id: noteId, projectId },
    select: { id: true, authorId: true, isPublic: true },
  });

  if (!existing) {
    throw new HttpError(404, 'Nota no encontrada');
  }

  if (existing.authorId !== userId) {
    if (!existing.isPublic) {
      throw new HttpError(404, 'Nota no encontrada');
    }
    if (req.projectRole !== 'owner') {
      throw new HttpError(403, 'Solo el owner puede borrar notas de otros');
    }
  }

  await prisma.note.delete({ where: { id: existing.id } });

  res.status(204).end();
}
