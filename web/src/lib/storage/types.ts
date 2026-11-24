export type ProjectCategory = 'personal' | 'trabajo';
export type ProjectRole = 'owner' | 'editor' | 'viewer';
export type ProjectLinkType = 'front' | 'back' | 'repo' | 'db' | 'other';

export interface ProjectLink {
  id: string;
  type: ProjectLinkType;
  label: string;
  url: string;
}

export interface ProjectLinkInput {
  type: ProjectLinkType;
  label: string;
  url: string;
}

export interface ProjectLinkUpdate {
  type?: ProjectLinkType;
  label?: string;
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  category: ProjectCategory;
  role: ProjectRole;
  openTasks: number;
  createdAt: string;
  links: ProjectLink[];
}

export interface ProjectInput {
  name: string;
  subtitle?: string | null;
  description?: string | null;
  category: ProjectCategory;
  links?: ProjectLinkInput[];
}

export type ProjectUpdate = Partial<ProjectInput>;

export interface TaskAssignee {
  id: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  done: boolean;
  createdAt: string;
  assignee: TaskAssignee | null;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  assigneeId?: string | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  done?: boolean;
  assigneeId?: string | null;
}

export interface NoteAuthor {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author: NoteAuthor;
  isMine: boolean;
}

export interface NoteInput {
  content: string;
  isPublic?: boolean;
}

export interface NoteUpdate {
  content?: string;
  isPublic?: boolean;
}

export interface TaskFilters {
  assignee?: string;
  done?: 'true' | 'false';
}

export interface ProjectRepository {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project>;
  createProject(input: ProjectInput): Promise<Project>;
  updateProject(id: string, input: ProjectUpdate): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  listLinks(projectId: string): Promise<ProjectLink[]>;
  createLink(projectId: string, input: ProjectLinkInput): Promise<ProjectLink>;
  updateLink(
    projectId: string,
    linkId: string,
    input: ProjectLinkUpdate,
  ): Promise<ProjectLink>;
  deleteLink(projectId: string, linkId: string): Promise<void>;

  listTasks(projectId: string, filters?: TaskFilters): Promise<Task[]>;
  createTask(projectId: string, input: TaskInput): Promise<Task>;
  updateTask(
    projectId: string,
    taskId: string,
    input: TaskUpdate,
  ): Promise<Task>;
  deleteTask(projectId: string, taskId: string): Promise<void>;
  /** Builds the markdown and triggers the browser download. */
  exportTasks(projectId: string, filters?: TaskFilters): Promise<void>;

  listNotes(projectId: string): Promise<Note[]>;
  createNote(projectId: string, input: NoteInput): Promise<Note>;
  updateNote(
    projectId: string,
    noteId: string,
    input: NoteUpdate,
  ): Promise<Note>;
  deleteNote(projectId: string, noteId: string): Promise<void>;
}

export const GUEST_PROJECT_KEY = 'guest_project';

export class GuestLimitError extends Error {
  constructor() {
    super('Como invitado solo podés tener un proyecto.');
    this.name = 'GuestLimitError';
  }
}
