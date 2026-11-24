import { Router } from 'express';
import { acceptInvite, getInvite } from '../controllers/invite.controller';
import { requireAuth } from '../middleware/auth';

export const inviteRoutes = Router();

// Public: the landing page reads the invite before the user has a session.
inviteRoutes.get('/:token', getInvite);
inviteRoutes.post('/:token/accept', requireAuth, acceptInvite);
