import { apiFetch, apiFetchFile } from '../api';
import { downloadBlob, slugify } from '../todo-export';
import type {
  Note,
  NoteInput,
  NoteUpdate,
  Project,
  ProjectInput,
  ProjectLink,
  ProjectLinkInput,
  ProjectLinkUpdate,
  ProjectRepository,
  ProjectUpdate,
  Task,
  TaskFilters,
  TaskInput,
  TaskUpdate,
} from './types';

interface ProjectEnvelope {
  project: Project;
}

interface LinkEnvelope {
  link: ProjectLink;
}

interface TaskEnvelope {
  task: Task;
}

interface NoteEnvelope {
  note: Note;
}

/**
 * Deja el payload prolijo antes de mandarlo: los campos opcionales vacíos se
 * omiten (en vez de ir como `null` o `""`) y se descartan links incompletos.
 */
function cleanProjectInput(input: ProjectUpdate): ProjectUpdate {
  const { subtitle, description, links, ...rest } = input;
  const trimmedSubtitle = subtitle?.trim();
  const trimmedDescription = description?.trim();

  return {
    ...rest,
    ...(trimmedSubtitle ? { subtitle: trimmedSubtitle } : {}),
    ...(trimmedDescription ? { description: trimmedDescription } : {}),
    ...(links
      ? {
          links: links.filter(
            (link) => link.url.trim().length > 0 && link.label.trim().length > 0,
          ),
        }
      : {}),
  };
}

function taskQuery(filters?: TaskFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.assignee) params.set('assignee', filters.assignee);
  if (filters.done) params.set('done', filters.done);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Projects backed by the Express API. */
export class ApiRepository implements ProjectRepository {
  async listProjects(): Promise<Project[]> {
    return apiFetch<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    const { project } = await apiFetch<ProjectEnvelope>(
      `/projects/${encodeURIComponent(id)}`,
    );
    return project;
  }

  async createProject(input: ProjectInput): Promise<Project> {
    const { project } = await apiFetch<ProjectEnvelope>('/projects', {
      method: 'POST',
      body: JSON.stringify(cleanProjectInput(input)),
    });
    return project;
  }

  async updateProject(id: string, input: ProjectUpdate): Promise<Project> {
    const { project } = await apiFetch<ProjectEnvelope>(
      `/projects/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(cleanProjectInput(input)),
      },
    );
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await apiFetch<void>(`/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async listLinks(projectId: string): Promise<ProjectLink[]> {
    return apiFetch<ProjectLink[]>(`/projects/${projectId}/links`);
  }

  async createLink(
    projectId: string,
    input: ProjectLinkInput,
  ): Promise<ProjectLink> {
    const { link } = await apiFetch<LinkEnvelope>(
      `/projects/${projectId}/links`,
      { method: 'POST', body: JSON.stringify(input) },
    );
    return link;
  }

  async updateLink(
    projectId: string,
    linkId: string,
    input: ProjectLinkUpdate,
  ): Promise<ProjectLink> {
    const { link } = await apiFetch<LinkEnvelope>(
      `/projects/${projectId}/links/${linkId}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return link;
  }

  async deleteLink(projectId: string, linkId: string): Promise<void> {
    await apiFetch<void>(`/projects/${projectId}/links/${linkId}`, {
      method: 'DELETE',
    });
  }

  async listTasks(projectId: string, filters?: TaskFilters): Promise<Task[]> {
    return apiFetch<Task[]>(`/projects/${projectId}/tasks${taskQuery(filters)}`);
  }

  async createTask(projectId: string, input: TaskInput): Promise<Task> {
    const { task } = await apiFetch<TaskEnvelope>(
      `/projects/${projectId}/tasks`,
      { method: 'POST', body: JSON.stringify(input) },
    );
    return task;
  }

  async updateTask(
    projectId: string,
    taskId: string,
    input: TaskUpdate,
  ): Promise<Task> {
    const { task } = await apiFetch<TaskEnvelope>(
      `/projects/${projectId}/tasks/${taskId}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return task;
  }

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    await apiFetch<void>(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async exportTasks(projectId: string, filters?: TaskFilters): Promise<void> {
    const { blob, filename } = await apiFetchFile(
      `/projects/${projectId}/tasks/export.md${taskQuery(filters)}`,
    );
    downloadBlob(filename ?? `${slugify('proyecto')}-todo.md`, blob);
  }

  async listNotes(projectId: string): Promise<Note[]> {
    return apiFetch<Note[]>(`/projects/${projectId}/notes`);
  }

  async createNote(projectId: string, input: NoteInput): Promise<Note> {
    const { note } = await apiFetch<NoteEnvelope>(
      `/projects/${projectId}/notes`,
      { method: 'POST', body: JSON.stringify(input) },
    );
    return note;
  }

  async updateNote(
    projectId: string,
    noteId: string,
    input: NoteUpdate,
  ): Promise<Note> {
    const { note } = await apiFetch<NoteEnvelope>(
      `/projects/${projectId}/notes/${noteId}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return note;
  }

  async deleteNote(projectId: string, noteId: string): Promise<void> {
    await apiFetch<void>(`/projects/${projectId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  }
}

export const apiRepository = new ApiRepository();
