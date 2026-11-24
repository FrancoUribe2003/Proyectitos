import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectRole } from '../middleware/projectRole';
import { linkRoutes } from './link.routes';
import { memberRoutes } from './member.routes';
import { noteRoutes } from './note.routes';
import { projectInviteRoutes } from './projectInvite.routes';
import { taskRoutes } from './task.routes';

export const projectRoutes = Router();

projectRoutes.use(requireAuth);

projectRoutes.get('/', listProjects);
projectRoutes.post('/', createProject);
projectRoutes.get('/:id', requireProjectRole('viewer'), getProject);
projectRoutes.patch('/:id', requireProjectRole('owner'), updateProject);
projectRoutes.delete('/:id', requireProjectRole('owner'), deleteProject);

projectRoutes.use('/:id/members', memberRoutes);
projectRoutes.use('/:id/invites', projectInviteRoutes);
projectRoutes.use('/:id/links', linkRoutes);
projectRoutes.use('/:id/tasks', taskRoutes);
projectRoutes.use('/:id/notes', noteRoutes);
