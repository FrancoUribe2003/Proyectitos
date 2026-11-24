import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { getApiErrorMessage } from '../../lib/api';
import type { ProjectMember } from '../../lib/collab';
import { initials } from '../../lib/format';
import {
  useCreateTask,
  useDeleteTask,
  useExportTasks,
  useTasks,
  useUpdateTask,
} from '../../lib/storage/hooks';
import type { Task } from '../../lib/storage/types';
import { Modal } from '../Modal';

export type AssigneeFilter = 'all' | 'unassigned' | 'mine' | string;

interface TasksCardProps {
  projectId: string;
  canEdit: boolean;
  isSession: boolean;
  members: ProjectMember[];
  currentUserId: string | null;
  assigneeFilter: AssigneeFilter;
}

function matchesFilter(
  task: Task,
  filter: AssigneeFilter,
  currentUserId: string | null,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'unassigned') return task.assignee === null;
  if (filter === 'mine') return task.assignee?.id === currentUserId;
  return task.assignee?.id === filter;
}

function AssigneeBadge({ name }: { name: string }) {
  return (
    <span
      className="grid size-6 shrink-0 place-items-center rounded-full border border-line bg-surface text-[10px] font-bold text-ink-soft"
      title={`Asignada a ${name}`}
    >
      <span aria-hidden="true">{initials(name)}</span>
      <span className="sr-only">Asignada a {name}</span>
    </span>
  );
}

export function TasksCard({
  projectId,
  canEdit,
  isSession,
  members,
  currentUserId,
  assigneeFilter,
}: TasksCardProps) {
  const { data: tasks, isLoading, isError, error, refetch, isFetching } =
    useTasks(projectId);
  const createTask = useCreateTask(projectId);
  const exportTasks = useExportTasks(projectId);
  const [title, setTitle] = useState('');

  const filtered = (tasks ?? []).filter((task) =>
    matchesFilter(task, assigneeFilter, currentUserId),
  );
  const pending = filtered.filter((task) => !task.done);
  const completed = filtered.filter((task) => task.done);

  const assigneeForNew =
    assigneeFilter === 'mine'
      ? currentUserId
      : assigneeFilter === 'all' || assigneeFilter === 'unassigned'
        ? null
        : assigneeFilter;

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    createTask.mutate(
      { title: trimmed, description: null, assigneeId: assigneeForNew },
      { onSuccess: () => setTitle('') },
    );
  };

  const exportAssignee =
    assigneeFilter === 'all'
      ? undefined
      : assigneeFilter === 'mine'
        ? (currentUserId ?? undefined)
        : assigneeFilter;

  return (
    <section className="card flex h-full flex-col p-5 sm:p-6" aria-labelledby="todo-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="todo-title" className="text-xl text-ink">
          TODO
        </h2>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={() => exportTasks.mutate(exportAssignee)}
          disabled={exportTasks.isPending || isLoading}
        >
          {exportTasks.isPending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="size-4" aria-hidden="true" />
          )}
          Exportar .md
        </button>
      </div>

      {exportTasks.isError && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {getApiErrorMessage(exportTasks.error)}
        </p>
      )}

      {canEdit && (
        <form onSubmit={handleCreate} className="mt-4">
          <label htmlFor="quick-task" className="sr-only">
            Nueva tarea
          </label>
          <div className="flex gap-2">
            <input
              id="quick-task"
              type="text"
              className="field"
              placeholder="Agregar una tarea y presionar Enter"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              autoComplete="off"
              aria-describedby={createTask.isError ? 'quick-task-error' : undefined}
            />
            <button
              type="submit"
              className="btn btn-md btn-primary shrink-0"
              disabled={createTask.isPending || !title.trim()}
            >
              {createTask.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              <span className="sr-only sm:not-sr-only">Agregar</span>
            </button>
          </div>
          {createTask.isError && (
            <p id="quick-task-error" role="alert" className="mt-1.5 text-xs text-danger">
              {getApiErrorMessage(createTask.error)}
            </p>
          )}
        </form>
      )}

      {isLoading && (
        <div className="mt-5 space-y-2" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="skeleton h-11 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-5 rounded-xl border border-danger-line bg-danger-soft p-4">
          <div className="flex items-start gap-2 text-sm text-danger">
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

      {!isLoading && !isError && (
        <div className="mt-5 grid flex-1 gap-5 md:grid-cols-2">
          <TaskColumn
            title="Pendientes"
            tasks={pending}
            projectId={projectId}
            canEdit={canEdit}
            isSession={isSession}
            members={members}
            emptyText="No hay tareas pendientes con este filtro."
          />
          <TaskColumn
            title="Completadas"
            tasks={completed}
            projectId={projectId}
            canEdit={canEdit}
            isSession={isSession}
            members={members}
            emptyText="Todavía no completaste tareas."
          />
        </div>
      )}
    </section>
  );
}

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  projectId: string;
  canEdit: boolean;
  isSession: boolean;
  members: ProjectMember[];
  emptyText: string;
}

const TASKS_PER_PAGE = 7;

function TaskColumn({
  title,
  tasks,
  projectId,
  canEdit,
  isSession,
  members,
  emptyText,
}: TaskColumnProps) {
  const headingId = `task-column-${title.toLowerCase()}`;
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(tasks.length / TASKS_PER_PAGE));
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const pageTasks = tasks.slice(
    safePage * TASKS_PER_PAGE,
    (safePage + 1) * TASKS_PER_PAGE,
  );

  return (
    <div aria-labelledby={headingId} className="flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-semibold text-ink-soft">
          {title}
        </h3>
        <div className="flex items-center gap-1.5">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs text-ink-muted">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="grid size-6 place-items-center rounded-md border border-line bg-surface text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                aria-label={`Página anterior de tareas ${title.toLowerCase()}`}
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </button>
              <span className="tabular-nums px-0.5 text-xs font-medium">
                {safePage + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="grid size-6 place-items-center rounded-md border border-line bg-surface text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30"
                aria-label={`Página siguiente de tareas ${title.toLowerCase()}`}
              >
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          <span className="chip bg-surface-muted text-ink-muted">
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="flex min-h-[224px] flex-1 flex-col justify-start">
        {tasks.length === 0 ? (
          <div className="flex min-h-[224px] flex-1 items-center justify-center rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-ink-muted">
            {emptyText}
          </div>
        ) : (
          <ul className="space-y-2 overflow-y-auto pr-0.5">
            {pageTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                projectId={projectId}
                canEdit={canEdit}
                isSession={isSession}
                members={members}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface TaskItemProps {
  task: Task;
  projectId: string;
  canEdit: boolean;
  isSession: boolean;
  members: ProjectMember[];
}

function TaskItem({
  task,
  projectId,
  canEdit,
  isSession,
  members,
}: TaskItemProps) {
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? '');

  const toggle = () => {
    if (!canEdit) return;
    updateTask.mutate({ taskId: task.id, input: { done: !task.done } });
  };

  const resetForm = () => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setAssigneeId(task.assignee?.id ?? '');
    setConfirmDelete(false);
  };

  const handleOpen = () => {
    resetForm();
    setOpen((value) => !value);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    updateTask.mutate(
      {
        taskId: task.id,
        input: {
          title: trimmed,
          description: description.trim() || null,
          ...(isSession ? { assigneeId: assigneeId || null } : {}),
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setConfirmDelete(false);
        },
      },
    );
  };

  return (
    <li className="rounded-xl border border-line bg-surface-muted/60">
      <div className="flex min-h-[44px] items-center gap-2.5 px-3 py-1.5">
        <input
          type="checkbox"
          checked={task.done}
          onChange={toggle}
          disabled={!canEdit || updateTask.isPending}
          aria-label={
            task.done
              ? `Marcar «${task.title}» como pendiente`
              : `Marcar «${task.title}» como completada`
          }
          className="size-4 shrink-0 accent-[var(--color-accent)]"
        />
        <button
          type="button"
          onClick={handleOpen}
          aria-expanded={open}
          className="min-w-0 flex-1 rounded-sm py-0.5 text-left"
        >
          <span
            className={`block break-words text-sm leading-snug ${
              task.done ? 'text-ink-muted line-through' : 'text-ink'
            }`}
          >
            {task.title}
          </span>
          {task.description && (
            <span className="mt-0.5 block truncate text-xs text-ink-muted">
              {task.description}
            </span>
          )}
        </button>
        {task.assignee && <AssigneeBadge name={task.assignee.name} />}
        <button
          type="button"
          onClick={handleOpen}
          aria-expanded={open}
          aria-label={open ? 'Contraer detalles' : 'Expandir detalles'}
          title={open ? 'Contraer detalles' : 'Expandir detalles'}
          className="grid size-6 shrink-0 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${
              open ? 'rotate-180 text-ink' : ''
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {open && (
        <form
          onSubmit={handleSave}
          className="space-y-3 border-t border-line px-3 py-3"
        >
          <div>
            <label htmlFor={`task-title-${task.id}`} className="field-label">
              Título
            </label>
            <input
              id={`task-title-${task.id}`}
              className="field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              disabled={!canEdit}
              required
            />
          </div>
          <div>
            <label
              htmlFor={`task-description-${task.id}`}
              className="field-label"
            >
              Descripción
            </label>
            <textarea
              id={`task-description-${task.id}`}
              className="field min-h-20 resize-y"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              disabled={!canEdit}
              placeholder="Opcional"
            />
          </div>
          {isSession && (
            <div>
              <label
                htmlFor={`task-assignee-${task.id}`}
                className="field-label"
              >
                Asignada a
              </label>
              <select
                id={`task-assignee-${task.id}`}
                className="field"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                disabled={!canEdit}
              >
                <option value="">Sin asignar</option>
                {members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {updateTask.isError && (
            <p role="alert" className="text-xs text-danger">
              {getApiErrorMessage(updateTask.error)}
            </p>
          )}
          {deleteTask.isError && (
            <p role="alert" className="text-xs text-danger">
              {getApiErrorMessage(deleteTask.error)}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="btn btn-sm btn-primary"
                disabled={!canEdit || updateTask.isPending || !title.trim()}
              >
                {updateTask.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                Guardar
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Cerrar
              </button>
            </div>

            {canEdit && (
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
        </form>
      )}

      {confirmDelete && (
        <Modal
          open
          size="sm"
          onClose={() => setConfirmDelete(false)}
          title="¿Borrar tarea?"
          description={`Se va a eliminar «${task.title}». Esta acción no se puede deshacer.`}
        >
          <div className="space-y-4 p-6">
            {deleteTask.isError && (
              <p role="alert" className="text-xs text-danger">
                {getApiErrorMessage(deleteTask.error)}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-md btn-secondary"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteTask.isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-md btn-primary"
                onClick={() =>
                  deleteTask.mutate(task.id, {
                    onSuccess: () => {
                      setConfirmDelete(false);
                      setOpen(false);
                    },
                  })
                }
                disabled={deleteTask.isPending}
              >
                {deleteTask.isPending && (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                Sí, borrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </li>
  );
}
