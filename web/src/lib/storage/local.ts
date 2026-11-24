import { ApiError } from '../api';
import { buildTodoMarkdown, downloadMarkdown, slugify } from '../todo-export';
import {
  GUEST_PROJECT_KEY,
  GuestLimitError,
  type Note,
  type NoteInput,
  type NoteUpdate,
  type Project,
  type ProjectInput,
  type ProjectLink,
  type ProjectLinkInput,
  type ProjectLinkType,
  type ProjectLinkUpdate,
  type ProjectRepository,
  type ProjectUpdate,
  type Task,
  type TaskFilters,
  type TaskInput,
  type TaskUpdate,
} from './types';

const LINK_TYPES: ProjectLinkType[] = ['front', 'back', 'repo', 'db', 'other'];
const GUEST_USER = { id: 'guest', name: 'Invitado' };

/** What actually lives in localStorage: the project plus its collections. */
export interface GuestProject extends Project {
  tasks: Task[];
  notes: Note[];
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    (candidate.category === 'personal' || candidate.category === 'trabajo') &&
    (candidate.role === 'owner' ||
      candidate.role === 'editor' ||
      candidate.role === 'viewer') &&
    typeof candidate.createdAt === 'string'
  );
}

function sanitizeLinks(value: unknown): ProjectLink[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): ProjectLink[] => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.label !== 'string' ||
      typeof candidate.url !== 'string' ||
      !LINK_TYPES.includes(candidate.type as ProjectLinkType) ||
      !isHttpUrl(candidate.url)
    ) {
      return [];
    }
    return [
      {
        id: candidate.id,
        type: candidate.type as ProjectLinkType,
        label: candidate.label,
        url: candidate.url,
      },
    ];
  });
}

function sanitizeTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): Task[] => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.createdAt !== 'string'
    ) {
      return [];
    }
    const assignee = candidate.assignee as
      | { id?: unknown; name?: unknown }
      | null
      | undefined;
    return [
      {
        id: candidate.id,
        title: candidate.title,
        description:
          typeof candidate.description === 'string'
            ? candidate.description
            : null,
        done: candidate.done === true,
        createdAt: candidate.createdAt,
        assignee:
          assignee && typeof assignee.id === 'string' && typeof assignee.name === 'string'
            ? { id: assignee.id, name: assignee.name }
            : null,
      },
    ];
  });
}

function sanitizeNotes(value: unknown): Note[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): Note[] => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.content !== 'string' ||
      typeof candidate.createdAt !== 'string'
    ) {
      return [];
    }
    return [
      {
        id: candidate.id,
        content: candidate.content,
        isPublic: false,
        createdAt: candidate.createdAt,
        updatedAt:
          typeof candidate.updatedAt === 'string'
            ? candidate.updatedAt
            : candidate.createdAt,
        author: GUEST_USER,
        isMine: true,
      },
    ];
  });
}

export function readGuestProjectSnapshot(): GuestProject | null {
  try {
    const raw = window.localStorage.getItem(GUEST_PROJECT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isProject(parsed)) return null;
    // Projects saved by older versions get the missing collections added.
    const record = parsed as unknown as Record<string, unknown>;
    return {
      ...parsed,
      links: sanitizeLinks(record.links),
      tasks: sanitizeTasks(record.tasks),
      notes: sanitizeNotes(record.notes),
    };
  } catch {
    return null;
  }
}

export function clearGuestProject(): void {
  try {
    window.localStorage.removeItem(GUEST_PROJECT_KEY);
  } catch {
    // Storage can be unavailable; nothing else to clean.
  }
}

function writeGuestProject(project: GuestProject | null): void {
  if (project) {
    window.localStorage.setItem(GUEST_PROJECT_KEY, JSON.stringify(project));
  } else {
    window.localStorage.removeItem(GUEST_PROJECT_KEY);
  }
}

function normalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function newId(kind: string): string {
  return `guest-${kind}-${crypto.randomUUID()}`;
}

/** Keeps the card counter in sync with the guest task list. */
function withOpenTasks(project: GuestProject): GuestProject {
  return {
    ...project,
    openTasks: project.tasks.filter((task) => !task.done).length,
  };
}

/**
 * Guest storage. It intentionally holds a single project under `guest_project`
 * and never touches the server.
 */
export class LocalRepository implements ProjectRepository {
  private read(): GuestProject {
    const project = readGuestProjectSnapshot();
    if (!project) {
      throw new ApiError('Proyecto no encontrado', 404);
    }
    return project;
  }

  private write(project: GuestProject): GuestProject {
    const next = withOpenTasks(project);
    writeGuestProject(next);
    return next;
  }

  async listProjects(): Promise<Project[]> {
    const project = readGuestProjectSnapshot();
    return project ? [project] : [];
  }

  async getProject(id: string): Promise<Project> {
    const project = this.read();
    if (project.id !== id) {
      throw new ApiError('Proyecto no encontrado', 404);
    }
    return project;
  }

  async createProject(input: ProjectInput): Promise<Project> {
    if (readGuestProjectSnapshot()) {
      throw new GuestLimitError();
    }

    const project: GuestProject = {
      id: newId('project'),
      name: input.name.trim(),
      subtitle: normalize(input.subtitle),
      description: normalize(input.description),
      category: input.category,
      role: 'owner',
      openTasks: 0,
      createdAt: new Date().toISOString(),
      links: (input.links ?? [])
        .filter(
          (link) => link.label.trim().length > 0 && isHttpUrl(link.url.trim()),
        )
        .slice(0, 10)
        .map((link) => ({
          id: newId('link'),
          type: link.type,
          label: link.label.trim(),
          url: link.url.trim(),
        })),
      tasks: [],
      notes: [],
    };

    writeGuestProject(project);
    return project;
  }

  async updateProject(id: string, input: ProjectUpdate): Promise<Project> {
    const current = this.read();
    if (current.id !== id) {
      throw new ApiError('Proyecto no encontrado', 404);
    }
    const next: GuestProject = {
      ...current,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.subtitle !== undefined
        ? { subtitle: normalize(input.subtitle) }
        : {}),
      ...(input.description !== undefined
        ? { description: normalize(input.description) }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
    };
    return this.write(next);
  }

  async deleteProject(id: string): Promise<void> {
    const project = this.read();
    if (project.id === id) {
      clearGuestProject();
    }
  }

  async listLinks(projectId: string): Promise<ProjectLink[]> {
    return this.readMatching(projectId).links;
  }

  async createLink(
    projectId: string,
    input: ProjectLinkInput,
  ): Promise<ProjectLink> {
    const current = this.readMatching(projectId);
    const url = input.url.trim();
    if (!isHttpUrl(url)) {
      throw new ApiError('La URL debe ser http o https', 400);
    }
    const link: ProjectLink = {
      id: newId('link'),
      type: input.type,
      label: input.label.trim(),
      url,
    };
    this.write({ ...current, links: [...current.links, link] });
    return link;
  }

  async updateLink(
    projectId: string,
    linkId: string,
    input: ProjectLinkUpdate,
  ): Promise<ProjectLink> {
    const current = this.readMatching(projectId);
    const existing = current.links.find((link) => link.id === linkId);
    if (!existing) {
      throw new ApiError('Link no encontrado', 404);
    }
    if (input.url !== undefined && !isHttpUrl(input.url.trim())) {
      throw new ApiError('La URL debe ser http o https', 400);
    }
    const link: ProjectLink = {
      ...existing,
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.label !== undefined ? { label: input.label.trim() } : {}),
      ...(input.url !== undefined ? { url: input.url.trim() } : {}),
    };
    this.write({
      ...current,
      links: current.links.map((item) => (item.id === linkId ? link : item)),
    });
    return link;
  }

  async deleteLink(projectId: string, linkId: string): Promise<void> {
    const current = this.readMatching(projectId);
    this.write({
      ...current,
      links: current.links.filter((link) => link.id !== linkId),
    });
  }

  async listTasks(projectId: string, filters?: TaskFilters): Promise<Task[]> {
    const tasks = this.readMatching(projectId).tasks;
    return tasks
      .filter((task) => {
        if (filters?.done !== undefined && String(task.done) !== filters.done) {
          return false;
        }
        if (filters?.assignee === 'unassigned') {
          return task.assignee === null;
        }
        if (filters?.assignee && task.assignee?.id !== filters.assignee) {
          return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          Number(a.done) - Number(b.done) ||
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }

  async createTask(projectId: string, input: TaskInput): Promise<Task> {
    const current = this.readMatching(projectId);
    const task: Task = {
      id: newId('task'),
      title: input.title.trim(),
      description: normalize(input.description),
      done: false,
      createdAt: new Date().toISOString(),
      // The guest has no members, so tasks are always unassigned.
      assignee: null,
    };
    this.write({ ...current, tasks: [...current.tasks, task] });
    return task;
  }

  async updateTask(
    projectId: string,
    taskId: string,
    input: TaskUpdate,
  ): Promise<Task> {
    const current = this.readMatching(projectId);
    const existing = current.tasks.find((task) => task.id === taskId);
    if (!existing) {
      throw new ApiError('Task no encontrada', 404);
    }
    const task: Task = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined
        ? { description: normalize(input.description) }
        : {}),
      ...(input.done !== undefined ? { done: input.done } : {}),
    };
    this.write({
      ...current,
      tasks: current.tasks.map((item) => (item.id === taskId ? task : item)),
    });
    return task;
  }

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    const current = this.readMatching(projectId);
    this.write({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
    });
  }

  async exportTasks(projectId: string, filters?: TaskFilters): Promise<void> {
    const [project, tasks] = await Promise.all([
      this.getProject(projectId),
      this.listTasks(projectId, filters),
    ]);
    downloadMarkdown(
      `${slugify(project.name)}-todo.md`,
      buildTodoMarkdown(project.name, tasks),
    );
  }

  async listNotes(projectId: string): Promise<Note[]> {
    return [...this.readMatching(projectId).notes].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async createNote(projectId: string, input: NoteInput): Promise<Note> {
    const current = this.readMatching(projectId);
    const now = new Date().toISOString();
    const note: Note = {
      id: newId('note'),
      content: input.content.trim(),
      isPublic: false,
      createdAt: now,
      updatedAt: now,
      author: GUEST_USER,
      isMine: true,
    };
    this.write({ ...current, notes: [note, ...current.notes] });
    return note;
  }

  async updateNote(
    projectId: string,
    noteId: string,
    input: NoteUpdate,
  ): Promise<Note> {
    const current = this.readMatching(projectId);
    const existing = current.notes.find((note) => note.id === noteId);
    if (!existing) {
      throw new ApiError('Nota no encontrada', 404);
    }
    const note: Note = {
      ...existing,
      ...(input.content !== undefined
        ? { content: input.content.trim() }
        : {}),
      updatedAt: new Date().toISOString(),
    };
    this.write({
      ...current,
      notes: current.notes.map((item) => (item.id === noteId ? note : item)),
    });
    return note;
  }

  async deleteNote(projectId: string, noteId: string): Promise<void> {
    const current = this.readMatching(projectId);
    this.write({
      ...current,
      notes: current.notes.filter((note) => note.id !== noteId),
    });
  }

  private readMatching(projectId: string): GuestProject {
    const project = this.read();
    if (project.id !== projectId) {
      throw new ApiError('Proyecto no encontrado', 404);
    }
    return project;
  }
}

export const localRepository = new LocalRepository();
