import {
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Download, LoaderCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { getApiErrorMessage } from '../lib/api';
import { GuestImportContext } from '../lib/guest-import-context';
import { apiRepository } from '../lib/storage/remote';
import { clearGuestProject, readGuestProjectSnapshot } from '../lib/storage/local';
import { Modal } from './Modal';

const DISMISS_KEY = 'guest_import_dismissed';

function wasDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberDismissed(): void {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // Session storage can be unavailable; the dialog just runs again.
  }
}

/**
 * Offers to move the localStorage guest project into the account after login.
 * It never runs on /invite/:token, where the invitation flow owns the screen.
 */
export function GuestImportProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(wasDismissed);
  const [requested, setRequested] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onInviteRoute = location.pathname.startsWith('/invite/');
  const guestProject = readGuestProjectSnapshot();
  const open =
    guestProject !== null &&
    (requested ||
      (status === 'authenticated' && !onInviteRoute && !dismissed));

  const requestImport = useCallback(() => {
    if (!readGuestProjectSnapshot()) return;
    setError(null);
    setRequested(true);
  }, []);

  const dismiss = useCallback(() => {
    rememberDismissed();
    setDismissed(true);
    setRequested(false);
    setError(null);
  }, []);

  const importProject = async () => {
    const snapshot = readGuestProjectSnapshot();
    if (!snapshot) return;

    setImporting(true);
    setError(null);
    let projectId: string | null = null;

    try {
      const project = await apiRepository.createProject({
        name: snapshot.name,
        subtitle: snapshot.subtitle,
        description: snapshot.description,
        category: snapshot.category,
        links: snapshot.links.map((link) => ({
          type: link.type,
          label: link.label,
          url: link.url,
        })),
      });
      projectId = project.id;

      for (const task of snapshot.tasks) {
        const created = await apiRepository.createTask(project.id, {
          title: task.title,
          description: task.description,
          assigneeId: null,
        });
        if (task.done) {
          await apiRepository.updateTask(project.id, created.id, {
            done: true,
          });
        }
      }

      for (const note of snapshot.notes) {
        await apiRepository.createNote(project.id, {
          content: note.content,
          isPublic: false,
        });
      }
    } catch (caught) {
      // Roll back the partial remote project; the local copy stays intact.
      if (projectId) {
        await apiRepository.deleteProject(projectId).catch(() => undefined);
      }
      setError(getApiErrorMessage(caught));
      setImporting(false);
      return;
    }

    clearGuestProject();
    rememberDismissed();
    setDismissed(true);
    setRequested(false);
    setImporting(false);
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    navigate(`/p/${projectId}`);
  };

  return (
    <GuestImportContext.Provider
      value={{ hasGuestProject: guestProject !== null, requestImport }}
    >
      {children}

      {open && guestProject && (
        <Modal
          open
          onClose={dismiss}
          title="Tenés un proyecto de invitado"
          description="Está guardado solo en este navegador. Podés llevarlo a tu cuenta."
        >
          <div className="space-y-4 p-6">
            <p className="text-sm leading-relaxed text-ink-soft">
              ¿Importar «{guestProject.name}» a tu cuenta? Se copian su
              descripción, links, tareas y notas. Tu copia local se borra
              recién cuando termine todo.
            </p>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-danger-line bg-danger-soft px-3.5 py-3 text-sm text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-md btn-secondary"
                onClick={dismiss}
                disabled={importing}
              >
                Ahora no
              </button>
              <button
                type="button"
                className="btn btn-md btn-primary"
                onClick={() => void importProject()}
                disabled={importing}
              >
                {importing ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="size-4" aria-hidden="true" />
                )}
                {importing ? 'Importando…' : 'Importar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </GuestImportContext.Provider>
  );
}
