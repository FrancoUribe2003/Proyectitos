import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Link2,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { getApiErrorMessage } from '../../lib/api';
import { removeMember } from '../../lib/collab';
import { isHttpUrl, LINK_META, LINK_TYPE_OPTIONS } from '../../lib/links';
import {
  useCreateLink,
  useDeleteLink,
  useDeleteProject,
  useLinks,
  useUpdateLink,
  useUpdateProject,
} from '../../lib/storage/hooks';
import type {
  Project,
  ProjectCategory,
  ProjectLink,
  ProjectLinkType,
} from '../../lib/storage/types';
import { Modal } from '../Modal';

interface SettingsModalProps {
  project: Project;
  isGuest: boolean;
  isOwner: boolean;
  canEditLinks: boolean;
  currentUserId: string | null;
  onClose: () => void;
  onDeleted: () => void;
  onLeft: () => void;
}

export function SettingsModal({
  project,
  isGuest,
  isOwner,
  canEditLinks,
  currentUserId,
  onClose,
  onDeleted,
  onLeft,
}: SettingsModalProps) {
  const updateProject = useUpdateProject(project.id);
  const deleteProject = useDeleteProject();
  const links = useLinks(project.id);

  const [name, setName] = useState(project.name);
  const [subtitle, setSubtitle] = useState(project.subtitle ?? '');
  const [description, setDescription] = useState(project.description ?? '');
  const [category, setCategory] = useState<ProjectCategory>(project.category);
  const [confirmName, setConfirmName] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    updateProject.mutate({
      name: name.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      category,
    });
  };

  const handleDelete = () => {
    if (confirmName.trim() !== project.name) return;
    deleteProject.mutate(project.id, { onSuccess: onDeleted });
  };

  const handleLeave = async () => {
    if (!currentUserId) return;
    setLeaveError(null);
    setLeaving(true);
    try {
      await removeMember(project.id, currentUserId);
      onLeft();
    } catch (error) {
      setLeaveError(getApiErrorMessage(error));
    } finally {
      setLeaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Ajustes"
      description="Datos del proyecto, links y zona de peligro."
    >
      <div className="space-y-7 p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <fieldset disabled={!isOwner} className="space-y-4">
            <legend className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
              Datos del proyecto
            </legend>
            <div>
              <label htmlFor="settings-name" className="field-label">
                Nombre <span className="text-accent">*</span>
              </label>
              <input
                id="settings-name"
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                required
              />
            </div>
            <div>
              <label htmlFor="settings-subtitle" className="field-label">
                Subtítulo
              </label>
              <input
                id="settings-subtitle"
                className="field"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                maxLength={120}
              />
            </div>
            <div>
              <label htmlFor="settings-description" className="field-label">
                Descripción
              </label>
              <textarea
                id="settings-description"
                className="field min-h-24 resize-y"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={2000}
              />
            </div>
            <div>
              <label htmlFor="settings-category" className="field-label">
                Categoría
              </label>
              <select
                id="settings-category"
                className="field"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as ProjectCategory)
                }
              >
                <option value="personal">Personal</option>
                <option value="trabajo">Trabajo</option>
              </select>
            </div>
          </fieldset>

          {isOwner && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-md btn-primary"
                disabled={updateProject.isPending || !name.trim()}
              >
                {updateProject.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                Guardar datos
              </button>
            </div>
          )}
          {updateProject.isError && (
            <p role="alert" className="text-sm text-danger">
              {getApiErrorMessage(updateProject.error)}
            </p>
          )}
          {updateProject.isSuccess && (
            <p role="status" className="text-sm text-success">
              Datos guardados.
            </p>
          )}
        </form>

        <section className="border-t border-line pt-5" aria-labelledby="links-title">
          <h3 id="links-title" className="flex items-center gap-2 text-lg text-ink">
            <Link2 className="size-4" aria-hidden="true" />
            Links
          </h3>

          {links.isLoading && (
            <div className="mt-3 space-y-2" aria-hidden="true">
              <div className="skeleton h-10 rounded-lg" />
              <div className="skeleton h-10 rounded-lg" />
            </div>
          )}
          {links.isError && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {getApiErrorMessage(links.error)}
            </p>
          )}

          {links.data && links.data.length > 0 && (
            <ul className="mt-3 space-y-2">
              {links.data.map((link) => (
                <LinkRow
                  key={link.id}
                  projectId={project.id}
                  link={link}
                  canEdit={canEditLinks}
                />
              ))}
            </ul>
          )}
          {links.data && links.data.length === 0 && (
            <p className="mt-2 text-sm text-ink-muted">
              Sin links guardados.
            </p>
          )}

          {canEditLinks && <AddLinkForm projectId={project.id} />}

          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            No pegues contraseñas ni connection strings con credenciales en los
            links.
          </p>
        </section>

        <section className="border-t border-line pt-5" aria-labelledby="danger-title">
          <h3 id="danger-title" className="text-lg text-ink">
            Zona de peligro
          </h3>
          {isOwner ? (
            <div className="mt-3 rounded-xl border border-danger-line bg-danger-soft p-4">
              <p className="text-sm text-danger">
                Borrar el proyecto elimina sus tareas, notas y links.
              </p>
              <label htmlFor="settings-confirm-name" className="field-label mt-3">
                Escribí “{project.name}” para confirmar
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="settings-confirm-name"
                  className="field min-w-0 flex-1 bg-surface"
                  value={confirmName}
                  onChange={(event) => setConfirmName(event.target.value)}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="btn btn-md btn-primary"
                  onClick={handleDelete}
                  disabled={
                    confirmName.trim() !== project.name ||
                    deleteProject.isPending
                  }
                >
                  {deleteProject.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="size-4" aria-hidden="true" />
                  )}
                  Borrar proyecto
                </button>
              </div>
              {deleteProject.isError && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {getApiErrorMessage(deleteProject.error)}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-line bg-surface-muted p-4">
              <p className="text-sm text-ink-soft">
                Podés dejar de participar de este proyecto cuando quieras.
              </p>
              {confirmLeave ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => void handleLeave()}
                    disabled={leaving}
                  >
                    {leaving && (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    )}
                    Sí, salir
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => setConfirmLeave(false)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary mt-3 text-danger"
                  onClick={() => setConfirmLeave(true)}
                >
                  Salir del proyecto
                </button>
              )}
              {leaveError && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {leaveError}
                </p>
              )}
            </div>
          )}
          {isGuest && (
            <p className="mt-2 text-xs text-ink-muted">
              Este proyecto vive solo en este navegador.
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}

interface LinkRowProps {
  projectId: string;
  link: ProjectLink;
  canEdit: boolean;
}

function LinkRow({ projectId, link, canEdit }: LinkRowProps) {
  const updateLink = useUpdateLink(projectId);
  const deleteLink = useDeleteLink(projectId);
  const [type, setType] = useState<ProjectLinkType>(link.type);
  const [label, setLabel] = useState(link.label);
  const [url, setUrl] = useState(link.url);

  const invalidUrl = url.trim().length > 0 && !isHttpUrl(url.trim());
  const dirty =
    type !== link.type || label.trim() !== link.label || url.trim() !== link.url;

  return (
    <li className="rounded-xl border border-line bg-surface-muted/60 p-3">
      <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
        <div>
          <label htmlFor={`link-type-${link.id}`} className="sr-only">
            Tipo de link
          </label>
          <select
            id={`link-type-${link.id}`}
            className="field"
            value={type}
            onChange={(event) => setType(event.target.value as ProjectLinkType)}
            disabled={!canEdit}
          >
            {LINK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor={`link-label-${link.id}`} className="sr-only">
            Nombre del link
          </label>
          <input
            id={`link-label-${link.id}`}
            className="field"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={60}
            placeholder="Nombre"
            disabled={!canEdit}
          />
          <label htmlFor={`link-url-${link.id}`} className="sr-only">
            URL del link
          </label>
          <input
            id={`link-url-${link.id}`}
            className={`field ${invalidUrl ? 'border-danger' : ''}`}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            inputMode="url"
            spellCheck={false}
            placeholder="https://…"
            disabled={!canEdit}
            aria-invalid={invalidUrl || undefined}
          />
          {invalidUrl && (
            <p role="alert" className="text-xs text-danger">
              Tiene que ser una URL http o https.
            </p>
          )}
        </div>
        <div className="flex items-start gap-1 sm:flex-col">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() =>
              updateLink.mutate({
                linkId: link.id,
                input: { type, label: label.trim(), url: url.trim() },
              })
            }
            disabled={
              !canEdit || !dirty || invalidUrl || !label.trim() || updateLink.isPending
            }
          >
            {updateLink.isPending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            Guardar
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost text-danger"
            onClick={() => deleteLink.mutate(link.id)}
            disabled={!canEdit || deleteLink.isPending}
            aria-label={`Quitar link ${link.label}`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {(updateLink.isError || deleteLink.isError) && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {getApiErrorMessage(updateLink.error ?? deleteLink.error)}
        </p>
      )}
    </li>
  );
}

interface AddLinkFormProps {
  projectId: string;
}

function AddLinkForm({ projectId }: AddLinkFormProps) {
  const createLink = useCreateLink(projectId);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ProjectLinkType>('other');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!label.trim()) {
      setError('Poné un nombre para el link.');
      return;
    }
    if (!isHttpUrl(url.trim())) {
      setError('Tiene que ser una URL http o https.');
      return;
    }
    createLink.mutate(
      { type, label: label.trim(), url: url.trim() },
      {
        onSuccess: () => {
          setLabel('');
          setUrl('');
          setType('other');
          setOpen(false);
        },
      },
    );
  };

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-sm btn-secondary mt-3"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" aria-hidden="true" />
        Agregar link
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-2 rounded-xl border border-line bg-surface-muted/60 p-3"
    >
      <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor="new-link-type" className="field-label">
            Tipo
          </label>
          <select
            id="new-link-type"
            className="field"
            value={type}
            onChange={(event) => setType(event.target.value as ProjectLinkType)}
          >
            {LINK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="new-link-label" className="field-label">
            Nombre
          </label>
          <input
            id="new-link-label"
            className="field"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={60}
            placeholder={LINK_META[type].label}
          />
        </div>
      </div>
      <div>
        <label htmlFor="new-link-url" className="field-label">
          URL
        </label>
        <input
          id="new-link-url"
          className="field"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          inputMode="url"
          spellCheck={false}
          placeholder="https://…"
        />
      </div>
      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-danger">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {createLink.isError && (
        <p role="alert" className="text-xs text-danger">
          {getApiErrorMessage(createLink.error)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="btn btn-sm btn-primary"
          disabled={createLink.isPending}
        >
          {createLink.isPending && (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          )}
          Guardar link
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
