import { Router } from 'express';
import { login, logout, me, refresh, register } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/register', register);
authRoutes.post('/login', login);
authRoutes.post('/refresh', refresh);
authRoutes.post('/logout', logout);
authRoutes.get('/me', requireAuth, me);
