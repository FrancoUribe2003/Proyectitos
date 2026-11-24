import { Router } from 'express';
import {
  createLink,
  deleteLink,
  listLinks,
  updateLink,
} from '../controllers/link.controller';
import { requireProjectRole } from '../middleware/projectRole';

export const linkRoutes = Router({ mergeParams: true });

linkRoutes.get('/', requireProjectRole('viewer'), listLinks);
linkRoutes.post('/', requireProjectRole('editor'), createLink);
linkRoutes.patch('/:linkId', requireProjectRole('editor'), updateLink);
linkRoutes.delete('/:linkId', requireProjectRole('editor'), deleteLink);
