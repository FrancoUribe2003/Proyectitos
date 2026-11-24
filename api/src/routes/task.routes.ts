import { Router } from 'express';
import {
  createTask,
  deleteTask,
  exportTasksMarkdown,
  listTasks,
  updateTask,
} from '../controllers/task.controller';
import { requireProjectRole } from '../middleware/projectRole';

export const taskRoutes = Router({ mergeParams: true });

taskRoutes.get('/', requireProjectRole('viewer'), listTasks);
taskRoutes.get('/export.md', requireProjectRole('viewer'), exportTasksMarkdown);
taskRoutes.post('/', requireProjectRole('editor'), createTask);
taskRoutes.patch('/:taskId', requireProjectRole('editor'), updateTask);
taskRoutes.delete('/:taskId', requireProjectRole('editor'), deleteTask);
