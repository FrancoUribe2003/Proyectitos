import { useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  RefreshCw,
  Unlock,
} from 'lucide-react';
import { getApiErrorMessage } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { useNotes } from '../../lib/storage/hooks';
import type { Note } from '../../lib/storage/types';
import { NoteDialog } from './NoteDialog';

interface NotesCardProps {
  projectId: string;
  canEdit: boolean;
  isOwner: boolean;
  session: boolean;
}

const NOTES_PER_PAGE = 3;

export function NotesCard({
  projectId,
  canEdit,
  isOwner,
  session,
}: NotesCardProps) {
  const { data: notes, isLoading, isError, error, refetch, isFetching } =
    useNotes(projectId);
  const [creating, setCreating] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [page, setPage] = useState(0);

  const totalNotes = notes?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalNotes / NOTES_PER_PAGE));
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageNotes = (notes ?? []).slice(
    safePage * NOTES_PER_PAGE,
    (safePage + 1) * NOTES_PER_PAGE,
  );

  return (
    <section className="card flex flex-col p-5 sm:p-6" aria-labelledby="notes-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="notes-title" className="text-xl text-ink">
          Notas
        </h2>
        <div className="flex items-center gap-1.5">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs text-ink-muted">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="grid size-7 place-items-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                aria-label="Notas anteriores"
                title="Notas anteriores"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <span className="tabular-nums px-0.5 text-xs font-medium">
                {safePage + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="grid size-7 place-items-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                aria-label="Notas siguientes"
                title="Notas siguientes"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {canEdit && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setCreating(true);
                setPage(0);
              }}
              aria-label="Crear nota"
              title="Crear nota"
            >
              <Plus className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex min-h-[224px] flex-col justify-start">
        {isLoading && (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="skeleton h-[68px] rounded-xl" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-danger-line bg-danger-soft p-3 text-sm text-danger">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{getApiErrorMessage(error)}</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-secondary mt-3"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        )}

        {!isLoading && !isError && totalNotes === 0 && (
          <div className="flex min-h-[224px] flex-1 items-center justify-center rounded-xl border border-dashed border-line p-6 text-center text-xs text-ink-muted">
            {canEdit
              ? 'Todavía no hay notas. Creá la primera con el botón +.'
              : 'Este proyecto todavía no tiene notas.'}
          </div>
        )}

        {!isLoading && !isError && totalNotes > 0 && (
          <ul className="space-y-2">
            {pageNotes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => setActiveNote(note)}
                  className="w-full rounded-xl border border-line bg-surface-muted/60 px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-surface-muted"
                >
                  <span className="line-clamp-2 block whitespace-pre-line break-words text-sm leading-snug text-ink">
                    {note.content}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
                    <span>{formatDate(note.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{note.author.name}</span>
                    {session && (
                      <span className="chip ml-auto border border-line bg-surface text-ink-soft">
                        {note.isPublic ? (
                          <Unlock className="size-3" aria-hidden="true" />
                        ) : (
                          <Lock className="size-3" aria-hidden="true" />
                        )}
                        {note.isPublic ? 'Pública' : 'Privada'}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {creating && (
        <NoteDialog
          projectId={projectId}
          note={null}
          canEdit={canEdit}
          isOwner={isOwner}
          session={session}
          onClose={() => setCreating(false)}
        />
      )}

      {activeNote && (
        <NoteDialog
          projectId={projectId}
          note={activeNote}
          canEdit={canEdit}
          isOwner={isOwner}
          session={session}
          onClose={() => setActiveNote(null)}
        />
      )}
    </section>
  );
}
