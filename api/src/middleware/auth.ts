import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';
import { verifyAccessToken } from '../utils/jwt';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Token de acceso requerido');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new HttpError(401, 'Token de acceso requerido');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new HttpError(401, 'Token inválido o expirado');
  }

  if (typeof payload.sub !== 'string') {
    throw new HttpError(401, 'Token inválido o expirado');
  }

  req.userId = payload.sub;
  next();
}
