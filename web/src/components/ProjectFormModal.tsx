import { useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Briefcase,
  Folder,
  Link2,
  LoaderCircle,
  Plus,
} from 'lucide-react';
import { getApiErrorMessage } from '../lib/api';
import { useCreateProject } from '../lib/storage/hooks';
import {
  GuestLimitError,
  type ProjectCategory,
  type ProjectLinkInput,
  type ProjectLinkType,
} from '../lib/storage/types';
import { Modal } from './Modal';

interface ProjectFormModalProps {
  onClose: () => void;
}

interface FormState {
  name: string;
  subtitle: string;
  description: string;
  category: ProjectCategory;
  repo: string;
  front: string;
  back: string;
  db: string;
}

const initialForm: FormState = {
  name: '',
  subtitle: '',
  description: '',
  category: 'personal',
  repo: '',
  front: '',
  back: '',
  db: '',
};

const LINK_FIELDS = [
  {
    key: 'repo',
    type: 'repo',
    label: 'Repositorio (GitHub)',
    placeholder: 'https://github.com/usuario/proyecto',
    autoComplete: 'url',
  },
  {
    key: 'front',
    type: 'front',
    label: 'Deploy del front',
    placeholder: 'https://mi-proyecto.vercel.app',
    autoComplete: 'url',
  },
  {
    key: 'back',
    type: 'back',
    label: 'Deploy del back',
    placeholder: 'https://mi-api.onrender.com',
    autoComplete: 'url',
  },
  {
    key: 'db',
    type: 'db',
    label: 'Base de datos',
    placeholder: 'https://supabase.com/dashboard/project/...',
    autoComplete: 'url',
  },
] as const satisfies ReadonlyArray<{
  key: 'repo' | 'front' | 'back' | 'db';
  type: ProjectLinkType;
  label: string;
  placeholder: string;
  autoComplete: string;
}>;

type LinkFieldKey = (typeof LINK_FIELDS)[number]['key'];
type LinkErrors = Partial<Record<LinkFieldKey, string>>;

const LINK_LABELS: Record<ProjectLinkType, string> = {
  repo: 'Repo',
  front: 'Front',
  back: 'Back',
  db: 'DB',
  other: 'Link',
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ProjectFormModal({ onClose }: ProjectFormModalProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [linkErrors, setLinkErrors] = useState<LinkErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const createProject = useCreateProject();

  const update = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (
      key === 'repo' ||
      key === 'front' ||
      key === 'back' ||
      key === 'db'
    ) {
      setLinkErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('El nombre del proyecto es obligatorio.');
      nameRef.current?.focus();
      return;
    }

    const nextLinkErrors: LinkErrors = {};
    for (const field of LINK_FIELDS) {
      const value = form[field.key].trim();
      if (value && !isHttpUrl(value)) {
        nextLinkErrors[field.key] =
          'Ingresá una URL http o https completa, por ejemplo https://…';
      }
    }

    if (Object.keys(nextLinkErrors).length > 0) {
      setLinkErrors(nextLinkErrors);
      const firstInvalid = LINK_FIELDS.find(
        (field) => nextLinkErrors[field.key],
      );
      if (firstInvalid) {
        document.getElementById(`project-link-${firstInvalid.key}`)?.focus();
      }
      return;
    }

    const links: ProjectLinkInput[] = LINK_FIELDS.flatMap((field) => {
      const url = form[field.key].trim();
      return url
        ? [{ type: field.type, label: LINK_LABELS[field.type], url }]
        : [];
    });

    const subtitle = form.subtitle.trim();
    const description = form.description.trim();

    try {
      await createProject.mutateAsync({
        name: form.name.trim(),
        ...(subtitle ? { subtitle } : {}),
        ...(description ? { description } : {}),
        category: form.category,
        links,
      });
      onClose();
    } catch (caught) {
      if (caught instanceof GuestLimitError) {
        setError(
          'Como invitado solo podés tener un proyecto. Iniciá sesión para crear más.',
        );
        return;
      }
      setError(getApiErrorMessage(caught));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo proyecto"
      description="Poné lo esencial. Después vas a poder sumar links, notas y tareas."
      initialFocusRef={nameRef}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="project-name" className="field-label">
              Nombre <span className="text-accent">*</span>
            </label>
            <input
              ref={nameRef}
              id="project-name"
              name="name"
              type="text"
              className="field"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              maxLength={80}
              required
              placeholder="Mi próximo proyecto"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-ink-muted">
              Hasta 80 caracteres.
            </p>
          </div>

          <div>
            <label htmlFor="project-subtitle" className="field-label">
              Subtítulo <span className="font-normal text-ink-muted">(opcional)</span>
            </label>
            <input
              id="project-subtitle"
              name="subtitle"
              type="text"
              className="field"
              value={form.subtitle}
              onChange={(event) => update('subtitle', event.target.value)}
              maxLength={120}
              placeholder="Una línea para ubicarlo rápido"
              autoComplete="off"
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="project-description" className="field-label">
                Descripción{' '}
                <span className="font-normal text-ink-muted">(opcional)</span>
              </label>
              <span className="text-[11px] tabular-nums text-ink-muted">
                {form.description.length}/2000
              </span>
            </div>
            <textarea
              id="project-description"
              name="description"
              className="field min-h-28 resize-y"
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="¿De qué se trata y qué querés lograr?"
            />
          </div>

          <fieldset>
            <legend className="field-label">Categoría</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'personal', label: 'Personal', icon: Folder },
                  { value: 'trabajo', label: 'Trabajo', icon: Briefcase },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-line-strong hover:bg-surface-muted has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-ink has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent"
                >
                  <input
                    type="radio"
                    name="category"
                    value={option.value}
                    checked={form.category === option.value}
                    onChange={() => update('category', option.value)}
                    className="sr-only"
                  />
                  <option.icon className="size-4" aria-hidden="true" />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset
            className="border-t border-line pt-4"
            aria-describedby="project-links-note"
          >
            <legend className="flex items-center gap-1.5 px-0 text-[13px] font-semibold text-ink-soft">
              <Link2 className="size-3.5" aria-hidden="true" />
              Links (opcional)
            </legend>
            <div className="mt-3 space-y-3">
              {LINK_FIELDS.map((field) => {
                const fieldError = linkErrors[field.key];
                const errorId = `project-link-${field.key}-error`;
                return (
                  <div key={field.key}>
                    <label
                      htmlFor={`project-link-${field.key}`}
                      className="field-label"
                    >
                      {field.label}{' '}
                      <span className="font-normal text-ink-muted">
                        (opcional)
                      </span>
                    </label>
                    <input
                      id={`project-link-${field.key}`}
                      name={`link-${field.key}`}
                      type="text"
                      inputMode="url"
                      className={`field ${
                        fieldError ? 'border-danger' : ''
                      }`}
                      value={form[field.key]}
                      onChange={(event) =>
                        update(field.key, event.target.value)
                      }
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      spellCheck={false}
                      maxLength={2048}
                      aria-invalid={fieldError ? true : undefined}
                      aria-describedby={fieldError ? errorId : undefined}
                    />
                    {fieldError && (
                      <p id={errorId} className="mt-1 text-xs text-danger">
                        {fieldError}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p
              id="project-links-note"
              className="mt-3 text-xs leading-relaxed text-ink-muted"
            >
              No pegues contraseñas ni connection strings con credenciales en
              los links.
            </p>
          </fieldset>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-danger-line bg-danger-soft px-3.5 py-3 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-md btn-secondary"
            onClick={onClose}
            disabled={createProject.isPending}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-md btn-primary"
            disabled={createProject.isPending}
          >
            {createProject.isPending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            {createProject.isPending ? 'Creando…' : 'Crear proyecto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
