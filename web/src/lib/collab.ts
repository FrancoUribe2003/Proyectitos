import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';
import type { ProjectRole } from './storage/types';

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
}

export type InviteRole = 'editor' | 'viewer';

export interface InviteLink {
  id: string;
  role: InviteRole;
  expiresAt: string;
  maxUses: number;
  uses: number;
  createdAt: string;
}

export interface CreatedInvite {
  id: string;
  role: InviteRole;
  expiresAt: string;
  maxUses: number;
  url: string;
}

export interface InvitePreview {
  projectName: string;
  role: InviteRole;
  invitedBy: string;
}

export interface CreateInviteInput {
  role: InviteRole;
  expiresInDays: 1 | 7 | 30;
  maxUses: number;
}

const memberKeys = {
  list: (projectId: string) => ['members', projectId] as const,
};

const inviteKeys = {
  list: (projectId: string) => ['invites', projectId] as const,
};

export async function listMembers(projectId: string): Promise<ProjectMember[]> {
  return apiFetch<ProjectMember[]>(`/projects/${projectId}/members`);
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  role: InviteRole,
): Promise<ProjectMember> {
  const { member } = await apiFetch<{ member: ProjectMember }>(
    `/projects/${projectId}/members/${userId}`,
    { method: 'PATCH', body: JSON.stringify({ role }) },
  );
  return member;
}

export async function removeMember(
  projectId: string,
  userId: string,
): Promise<void> {
  await apiFetch<void>(`/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
  });
}

export async function listInvites(projectId: string): Promise<InviteLink[]> {
  return apiFetch<InviteLink[]>(`/projects/${projectId}/invites`);
}

export async function createInvite(
  projectId: string,
  input: CreateInviteInput,
): Promise<CreatedInvite> {
  return apiFetch<CreatedInvite>(`/projects/${projectId}/invites`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function revokeInvite(
  projectId: string,
  inviteId: string,
): Promise<void> {
  await apiFetch<void>(`/projects/${projectId}/invites/${inviteId}`, {
    method: 'DELETE',
  });
}

/** Public: the invite landing page has no session yet. */
export async function fetchInvite(token: string): Promise<InvitePreview> {
  return apiFetch<InvitePreview>(`/invites/${encodeURIComponent(token)}`, {
    skipAuthRefresh: true,
  });
}

export async function acceptInvite(
  token: string,
): Promise<{ projectId: string; role?: InviteRole; alreadyMember?: boolean }> {
  return apiFetch<{
    projectId: string;
    role?: InviteRole;
    alreadyMember?: boolean;
  }>(`/invites/${encodeURIComponent(token)}/accept`, {
    method: 'POST',
  });
}

export function useMembers(projectId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: memberKeys.list(projectId ?? ''),
    queryFn: () => listMembers(projectId ?? ''),
    enabled: Boolean(projectId) && enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateMemberRole(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: InviteRole }) =>
      updateMemberRole(projectId, userId, role),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(projectId),
      });
    },
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(projectId, userId),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: memberKeys.list(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useInvites(projectId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: inviteKeys.list(projectId ?? ''),
    queryFn: () => listInvites(projectId ?? ''),
    enabled: Boolean(projectId) && enabled,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateInvite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInviteInput) => createInvite(projectId, input),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: inviteKeys.list(projectId),
      });
    },
  });
}

export function useRevokeInvite(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => revokeInvite(projectId, inviteId),
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: inviteKeys.list(projectId),
      });
    },
  });
}
