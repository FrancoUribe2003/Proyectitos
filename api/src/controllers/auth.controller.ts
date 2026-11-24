import type { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { loginSchema, registerSchema } from '../schemas/auth';
import { HttpError } from '../utils/httpError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
} as const;

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function refreshCookieOptions(): CookieOptions {
  const isProd = isProduction();
  return {
    httpOnly: true,
    path: '/auth',
    maxAge: REFRESH_MAX_AGE,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };
}

function setRefreshCookie(res: Response, userId: string): void {
  res.cookie(REFRESH_COOKIE, signRefreshToken(userId), refreshCookieOptions());
}

function clearRefreshCookie(res: Response): void {
  const { maxAge: _maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE, options);
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name } = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'El email ya está registrado');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    select: publicUserSelect,
  });

  setRefreshCookie(res, user.id);
  res.status(201).json({ user, accessToken: signAccessToken(user.id) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new HttpError(401, 'Email o contraseña incorrectos');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, 'Email o contraseña incorrectos');
  }

  const publicUser = { id: user.id, email: user.email, name: user.name };
  setRefreshCookie(res, user.id);
  res.json({ user: publicUser, accessToken: signAccessToken(user.id) });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = (req.cookies as Record<string, string | undefined>).refreshToken;
  if (!token) {
    throw new HttpError(401, 'Refresh token requerido');
  }

  let userId: string;
  try {
    const payload = verifyRefreshToken(token);
    if (typeof payload.sub !== 'string') {
      throw new Error('Payload inválido');
    }
    userId = payload.sub;
  } catch {
    throw new HttpError(401, 'Refresh token inválido o expirado');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) {
    throw new HttpError(401, 'Usuario no encontrado');
  }

  setRefreshCookie(res, user.id);
  res.json({ user, accessToken: signAccessToken(user.id) });
}

export function logout(_req: Request, res: Response): void {
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new HttpError(404, 'Usuario no encontrado');
  }

  res.json({ user });
}
