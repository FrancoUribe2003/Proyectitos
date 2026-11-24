import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useRepository, type RepositoryMode } from './useRepository';
import type {
  Note,
  NoteInput,
  NoteUpdate,
  Project,
  ProjectInput,
  ProjectLink,
  ProjectLinkInput,
  ProjectLinkUpdate,
  ProjectUpdate,
  Task,
  TaskInput,
  TaskUpdate,
} from './types';

const projectKeys = {
  list: (mode: RepositoryMode) => ['projects', mode] as const,
  detail: (mode: RepositoryMode, id: string) =>
    ['project', mode, id] as const,
  links: (mode: RepositoryMode, id: string) => ['links', mode, id] as const,
  tasks: (mode: RepositoryMode, id: string) => ['tasks', mode, id] as const,
  notes: (mode: RepositoryMode, id: string) => ['notes', mode, id] as const,
};

function invalidateProjectCounters(
  queryClient: QueryClient,
  mode: RepositoryMode,
  projectId: string,
): void {
  void queryClient.invalidateQueries({ queryKey: projectKeys.list(mode) });
  void queryClient.invalidateQueries({
    queryKey: projectKeys.detail(mode, projectId),
  });
}

export function useProjects() {
  const { repository, mode } = useRepository();
  return useQuery({
    queryKey: projectKeys.list(mode),
    queryFn: () => repository.listProjects(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useProject(id: string | undefined) {
  const { repository, mode } = useRepository();
  return useQuery({
    queryKey: projectKeys.detail(mode, id ?? ''),
    queryFn: () => repository.getProject(id ?? ''),
    enabled: Boolean(id),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateProject() {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProjectInput) => repository.createProject(input),
    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(
        projectKeys.list(mode),
        (current) => [project, ...(current ?? [])],
      );
      void queryClient.invalidateQueries({ queryKey: projectKeys.list(mode) });
    },
  });
}

export function useUpdateProject(id: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProjectUpdate) => repository.updateProject(id, input),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(mode, id), project);
      queryClient.setQueryData<Project[]>(
        projectKeys.list(mode),
        (current) =>
          current?.map((item) => (item.id === project.id ? project : item)) ??
          current,
      );
      void queryClient.invalidateQueries({ queryKey: projectKeys.list(mode) });
    },
  });
}

export function useDeleteProject() {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => repository.deleteProject(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(mode, id) });
      queryClient.setQueryData<Project[]>(
        projectKeys.list(mode),
        (current) => current?.filter((item) => item.id !== id) ?? current,
      );
      void queryClient.invalidateQueries({ queryKey: projectKeys.list(mode) });
    },
  });
}

export function useLinks(projectId: string | undefined) {
  const { repository, mode } = useRepository();
  return useQuery({
    queryKey: projectKeys.links(mode, projectId ?? ''),
    queryFn: () => repository.listLinks(projectId ?? ''),
    enabled: Boolean(projectId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateLink(projectId: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProjectLinkInput) =>
      repository.createLink(projectId, input),
    onSuccess: (link) => {
      queryClient.setQueryData<ProjectLink[]>(
        projectKeys.links(mode, projectId),
        (current) => [...(current ?? []), link],
      );
      void queryClient.invalidateQueries({
        queryKey: projectKeys.links(mode, projectId),
      });
      invalidateProjectCounters(queryClient, mode, projectId);
    },
  });
}

export function useUpdateLink(projectId: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      linkId,
      input,
    }: {
      linkId: string;
      input: ProjectLinkUpdate;
    }) => repository.updateLink(projectId, linkId, input),
    onSuccess: (link) => {
      queryClient.setQueryData<ProjectLink[]>(
        projectKeys.links(mode, projectId),
        (current) =>
          current?.map((item) => (item.id === link.id ? link : item)) ?? current,
      );
      void queryClient.invalidateQueries({
        queryKey: projectKeys.links(mode, projectId),
      });
      invalidateProjectCounters(queryClient, mode, projectId);
    },
  });
}

export function useDeleteLink(projectId: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => repository.deleteLink(projectId, linkId),
    onSuccess: (_data, linkId) => {
      queryClient.setQueryData<ProjectLink[]>(
        projectKeys.links(mode, projectId),
        (current) => current?.filter((item) => item.id !== linkId) ?? current,
      );
      void queryClient.invalidateQueries({
        queryKey: projectKeys.links(mode, projectId),
      });
      invalidateProjectCounters(queryClient, mode, projectId);
    },
  });
}

export function useTasks(projectId: string | undefined) {
  const { repository, mode } = useRepository();
  return useQuery({
    queryKey: projectKeys.tasks(mode, projectId ?? ''),
    queryFn: () => repository.listTasks(projectId ?? ''),
    enabled: Boolean(projectId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateTask(projectId: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskInput) => repository.createTask(projectId, input),
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(
        projectKeys.tasks(mode, projectId),
        (current) => (current ? [...current, task] : current),
      );
      void queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(mode, projectId),
      });
      invalidateProjectCounters(queryClient, mode, projectId);
    },
  });
}

export function useUpdateTask(projectId: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();
  const tasksKey = projectKeys.tasks(mode, projectId);

  return useMutation({
    mutationFn: ({
      taskId,
      input,
    }: {
      taskId: string;
      input: TaskUpdate;
    }) => repository.updateTask(projectId, taskId, input),
    onMutate: async ({ taskId, input }) => {
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const previous = queryClient.getQueryData<Task[]>(tasksKey);

      if (previous) {
        queryClient.setQueryData<Task[]>(
          tasksKey,
          previous.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  ...(input.title !== undefined ? { title: input.title } : {}),
                  ...(input.description !== undefined
                    ? { description: input.description }
                    : {}),
                  ...(input.done !== undefined ? { done: input.done } : {}),
                }
              : task,
          ),
        );
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tasksKey, context.previous);
      }
    },
    onSuccess: (task) => {
      queryClient.setQueryData<Task[]>(tasksKey, (current) =>
        current?.map((item) => (item.id === task.id ? task : item)) ?? current,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: tasksKey });
      invalidateProjectCounters(queryClient, mode, projectId);
    },
  });
}

export function useDeleteTask(projectId: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => repository.deleteTask(projectId, taskId),
    onSuccess: (_data, taskId) => {
      queryClient.setQueryData<Task[]>(
        projectKeys.tasks(mode, projectId),
        (current) => current?.filter((item) => item.id !== taskId) ?? current,
      );
      void queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(mode, projectId),
      });
      invalidateProjectCounters(queryClient, mode, projectId);
    },
  });
}

export function useExportTasks(projectId: string) {
  const { repository } = useRepository();
  return useMutation({
    mutationFn: (assignee?: string) =>
      repository.exportTasks(projectId, assignee ? { assignee } : undefined),
  });
}

export function useNotes(projectId: string | undefined) {
  const { repository, mode } = useRepository();
  return useQuery({
    queryKey: projectKeys.notes(mode, projectId ?? ''),
    queryFn: () => repository.listNotes(projectId ?? ''),
    enabled: Boolean(projectId),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateNote(projectId: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NoteInput) => repository.createNote(projectId, input),
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(
        projectKeys.notes(mode, projectId),
        (current) => [note, ...(current ?? [])],
      );
      void queryClient.invalidateQueries({
        queryKey: projectKeys.notes(mode, projectId),
      });
    },
  });
}

export function useUpdateNote(projectId: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      input,
    }: {
      noteId: string;
      input: NoteUpdate;
    }) => repository.updateNote(projectId, noteId, input),
    onSuccess: (note) => {
      queryClient.setQueryData<Note[]>(
        projectKeys.notes(mode, projectId),
        (current) =>
          current?.map((item) => (item.id === note.id ? note : item)) ?? current,
      );
      void queryClient.invalidateQueries({
        queryKey: projectKeys.notes(mode, projectId),
      });
    },
  });
}

export function useDeleteNote(projectId: string) {
  const { repository, mode } = useRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteId: string) => repository.deleteNote(projectId, noteId),
    onSuccess: (_data, noteId) => {
      queryClient.setQueryData<Note[]>(
        projectKeys.notes(mode, projectId),
        (current) => current?.filter((item) => item.id !== noteId) ?? current,
      );
      void queryClient.invalidateQueries({
        queryKey: projectKeys.notes(mode, projectId),
      });
    },
  });
}
