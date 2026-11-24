import { Router } from 'express';
import {
  createInvite,
  listInvites,
  revokeInvite,
} from '../controllers/invite.controller';
import { requireProjectRole } from '../middleware/projectRole';

export const projectInviteRoutes = Router({ mergeParams: true });

projectInviteRoutes.get('/', requireProjectRole('owner'), listInvites);
projectInviteRoutes.post('/', requireProjectRole('owner'), createInvite);
projectInviteRoutes.delete(
  '/:inviteId',
  requireProjectRole('owner'),
  revokeInvite,
);
