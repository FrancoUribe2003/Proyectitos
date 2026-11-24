import jwt from 'jsonwebtoken';

function getSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const secret = process.env[name];
  if (!secret) throw new Error(`Falta la variable de entorno ${name}`);
  return secret;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret('JWT_ACCESS_SECRET'), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES ?? '15m') as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret('JWT_REFRESH_SECRET'), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES ?? '7d') as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, getSecret('JWT_ACCESS_SECRET')) as jwt.JwtPayload;
}

export function verifyRefreshToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, getSecret('JWT_REFRESH_SECRET')) as jwt.JwtPayload;
}
