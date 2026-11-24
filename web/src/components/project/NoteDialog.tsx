import { useRef, useState, type FormEvent } from 'react';
import { LoaderCircle, Lock, Trash2, Unlock } from 'lucide-react';
import { getApiErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import {
  useCreateNote,
  useDeleteNote,
  useUpdateNote,
} from '../../lib/storage/hooks';
import type { Note } from '../../lib/storage/types';
import { Modal } from '../Modal';

interface NoteDialogProps {
  projectId: string;
  note: Note | null;
  canEdit: boolean;
  isOwner: boolean;
  session: boolean;
  onClose: () => void;
}

export function NoteDialog({
  projectId,
  note,
  canEdit,
  isOwner,
  session,
  onClose,
}: NoteDialogProps) {
  const createNote = useCreateNote(projectId);
  const updateNote = useUpdateNote(projectId);
  const deleteNote = useDeleteNote(projectId);
  const [editing, setEditing] = useState(note === null);
  const [content, setContent] = useState(note?.content ?? '');
  const [isPublic, setIsPublic] = useState(note?.isPublic ?? false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mutation = note ? updateNote : createNote;
  const canDelete =
    note !== null &&
    canEdit &&
    (note.isMine || (isOwner && note.isPublic));
  const canEditNote = note !== null && canEdit && note.isMine;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    if (note) {
      updateNote.mutate(
        { noteId: note.id, input: { content: trimmed, ...(session && note.isMine ? { isPublic } : {}) } },
        { onSuccess: () => setEditing(false) },
      );
    } else {
      createNote.mutate(
        { content: trimmed, isPublic: session ? isPublic : false },
        { onSuccess: onClose },
      );
    }
  };

  const title = note
    ? editing
      ? 'Editar nota'
      : 'Nota'
    : 'Nueva nota';

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={note ? undefined : 'Solo texto plano: no se renderiza HTML.'}
      initialFocusRef={editing ? textareaRef : undefined}
    >
      <div className="space-y-4 p-6">
        {note && !editing && (
          <>
            <p className="max-w-[68ch] whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
              {note.content}
            </p>
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs text-ink-muted">
              <span>{note.author.name}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDateTime(note.createdAt)}</span>
              {session && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="chip border border-line bg-surface-muted text-ink-soft">
                    {note.isPublic ? (
                      <Unlock className="size-3" aria-hidden="true" />
                    ) : (
                      <Lock className="size-3" aria-hidden="true" />
                    )}
                    {note.isPublic ? 'Pública' : 'Privada'}
                  </span>
                </>
              )}
            </div>
          </>
        )}

        {editing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="note-content" className="field-label">
                Contenido
              </label>
              <textarea
                id="note-content"
                ref={textareaRef}
                className="field min-h-40 resize-y"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={10000}
                required
                placeholder="Escribí la nota…"
              />
            </div>

            {session && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface-muted px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    Visible para los miembros
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    Si está apagada, solo vos podés verla.
                  </span>
                </span>
              </label>
            )}

            {mutation.isError && (
              <p role="alert" className="text-sm text-danger">
                {getApiErrorMessage(mutation.error)}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-md btn-secondary"
                onClick={() => {
                  if (note) {
                    setContent(note.content);
                    setIsPublic(note.isPublic);
                    setEditing(false);
                  } else {
                    onClose();
                  }
                }}
                disabled={mutation.isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-md btn-primary"
                disabled={mutation.isPending || !content.trim()}
              >
                {mutation.isPending && (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                )}
                {note ? 'Guardar cambios' : 'Crear nota'}
              </button>
            </div>
          </form>
        )}

        {note && !editing && (canEditNote || canDelete) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
            <div>
              {canEditNote && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setEditing(true)}
                >
                  Editar
                </button>
              )}
            </div>
            {canDelete && (
              <div className="flex flex-wrap items-center gap-1.5">
                {confirmDelete ? (
                  <>
                    <span className="text-xs text-ink-soft">¿Borrar nota?</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() =>
                        deleteNote.mutate(note.id, { onSuccess: onClose })
                      }
                      disabled={deleteNote.isPending}
                    >
                      Sí, borrar
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost text-danger"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Borrar
                  </button>
                )}
              </div>
            )}
            {deleteNote.isError && (
              <p role="alert" className="w-full text-xs text-danger">
                {getApiErrorMessage(deleteNote.error)}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
