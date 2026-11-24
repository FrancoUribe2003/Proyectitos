import { Router } from 'express';
import {
  createNote,
  deleteNote,
  listNotes,
  updateNote,
} from '../controllers/note.controller';
import { requireProjectRole } from '../middleware/projectRole';

export const noteRoutes = Router({ mergeParams: true });

noteRoutes.get('/', requireProjectRole('viewer'), listNotes);
noteRoutes.post('/', requireProjectRole('editor'), createNote);
noteRoutes.patch('/:noteId', requireProjectRole('viewer'), updateNote);
noteRoutes.delete('/:noteId', requireProjectRole('viewer'), deleteNote);
