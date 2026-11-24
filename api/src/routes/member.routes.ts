import { Router } from 'express';
import {
  listMembers,
  removeMember,
  updateMember,
} from '../controllers/member.controller';
import { requireProjectRole } from '../middleware/projectRole';

export const memberRoutes = Router({ mergeParams: true });

memberRoutes.get('/', requireProjectRole('viewer'), listMembers);
memberRoutes.patch('/:userId', requireProjectRole('owner'), updateMember);
memberRoutes.delete('/:userId', requireProjectRole('viewer'), removeMember);
