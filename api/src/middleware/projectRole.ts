import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../db/prisma';
import { HttpError } from '../utils/httpError';
import { getParam } from '../utils/params';

const ROLE_RANK: Record<Role, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

export function requireProjectRole(minRole: Role) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId;
    const projectId = getParam(req.params.id);

    if (!userId) {
      throw new HttpError(401, 'No autenticado');
    }

    if (!projectId) {
      throw new HttpError(404, 'Proyecto no encontrado');
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });

    if (!membership) {
      throw new HttpError(404, 'Proyecto no encontrado');
    }

    if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
      throw new HttpError(403, 'No tenés permisos suficientes');
    }

    req.projectRole = membership.role;
    next();
  };
}
