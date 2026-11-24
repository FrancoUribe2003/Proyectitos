import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Copy,
  LoaderCircle,
  LogOut,
  Trash2,
  UserRound,
} from 'lucide-react';
import { getApiErrorMessage } from '../../lib/api';
import {
  useCreateInvite,
  useInvites,
  useMembers,
  useRemoveMember,
  useRevokeInvite,
  useUpdateMemberRole,
  type CreatedInvite,
  type InviteRole,
} from '../../lib/collab';
import { formatDate, initials, roleLabel } from '../../lib/format';
import { Modal } from '../Modal';

interface MembersModalProps {
  projectId: string;
  currentUserId: string | null;
  isOwner: boolean;
  onClose: () => void;
  onLeft: () => void;
}

export function MembersModal({
  projectId,
  currentUserId,
  isOwner,
  onClose,
  onLeft,
}: MembersModalProps) {
  const members = useMembers(projectId, true);
  const invites = useInvites(projectId, isOwner);
  const updateRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveMember(projectId);
  const createInvite = useCreateInvite(projectId);
  const revokeInvite = useRevokeInvite(projectId);

  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [role, setRole] = useState<InviteRole>('editor');
  const [expiresInDays, setExpiresInDays] = useState<1 | 7 | 30>(7);
  const [maxUses, setMaxUses] = useState(1);
  const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCopied(false);
    createInvite.mutate(
      { role, expiresInDays, maxUses },
      { onSuccess: (invite) => setCreatedInvite(invite) },
    );
  };

  const copyInvite = async () => {
    if (!createdInvite) return;
    try {
      await navigator.clipboard.writeText(createdInvite.url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Miembros"
      description="Quién participa del proyecto y con qué rol."
    >
      <div className="space-y-6 p-6">
        {members.isLoading && (
          <div className="space-y-2" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        )}

        {members.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(members.error)}
          </p>
        )}

        {members.data && (
          <ul className="space-y-2">
            {members.data.map((member) => {
              const isSelf = member.userId === currentUserId;
              const isProjectOwner = member.role === 'owner';
              return (
                <li
                  key={member.userId}
                  className="rounded-xl border border-line bg-surface-muted/60 px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink"
                      aria-hidden="true"
                    >
                      {initials(member.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {member.name}
                        {isSelf && (
                          <span className="ml-1.5 text-xs font-normal text-ink-muted">
                            (vos)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {member.email}
                      </p>
                    </div>

                    {isOwner && !isProjectOwner ? (
                      <label className="flex items-center gap-2 text-xs text-ink-soft">
                        <span className="sr-only">
                          Rol de {member.name}
                        </span>
                        <select
                          className="field h-9 min-h-0 w-auto py-1 text-xs"
                          value={member.role}
                          onChange={(event) =>
                            updateRole.mutate({
                              userId: member.userId,
                              role: event.target.value as InviteRole,
                            })
                          }
                          disabled={updateRole.isPending}
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Solo lectura</option>
                        </select>
                      </label>
                    ) : (
                      <span className="chip border border-line bg-surface text-ink-soft">
                        {roleLabel(member.role)}
                      </span>
                    )}

                    {isOwner && !isProjectOwner && (
                      <div className="flex items-center gap-1.5">
                        {confirmRemove === member.userId ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() =>
                                removeMember.mutate(member.userId, {
                                  onSuccess: () => setConfirmRemove(null),
                                })
                              }
                              disabled={removeMember.isPending}
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => setConfirmRemove(null)}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost text-danger"
                            onClick={() => setConfirmRemove(member.userId)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Quitar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {updateRole.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(updateRole.error)}
          </p>
        )}
        {removeMember.isError && (
          <p role="alert" className="text-sm text-danger">
            {getApiErrorMessage(removeMember.error)}
          </p>
        )}

        {!isOwner && (
          <div className="border-t border-line pt-4">
            {confirmLeave ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-soft">
                  ¿Seguro que querés salir del proyecto?
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      if (!currentUserId) return;
                      removeMember.mutate(currentUserId, {
                        onSuccess: onLeft,
                      });
                    }}
                    disabled={removeMember.isPending || !currentUserId}
                  >
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
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-secondary text-danger"
                onClick={() => setConfirmLeave(true)}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Salir del proyecto
              </button>
            )}
          </div>
        )}

        {isOwner && (
          <section className="border-t border-line pt-5" aria-labelledby="invite-title">
            <h3 id="invite-title" className="flex items-center gap-2 text-lg text-ink">
              <UserRound className="size-4" aria-hidden="true" />
              Invitar
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              Creá un link para que otra persona se una a este proyecto.
            </p>

            <form
              onSubmit={handleCreateInvite}
              className="mt-3 grid gap-3 sm:grid-cols-2"
            >
              <div>
                <label htmlFor="invite-role" className="field-label">
                  Rol
                </label>
                <select
                  id="invite-role"
                  className="field"
                  value={role}
                  onChange={(event) => setRole(event.target.value as InviteRole)}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Solo lectura</option>
                </select>
              </div>
              <div>
                <label htmlFor="invite-expiry" className="field-label">
                  Vencimiento
                </label>
                <select
                  id="invite-expiry"
                  className="field"
                  value={expiresInDays}
                  onChange={(event) =>
                    setExpiresInDays(Number(event.target.value) as 1 | 7 | 30)
                  }
                >
                  <option value={1}>1 día</option>
                  <option value={7}>7 días</option>
                  <option value={30}>30 días</option>
                </select>
              </div>
              <div>
                <label htmlFor="invite-uses" className="field-label">
                  Usos máximos
                </label>
                <input
                  id="invite-uses"
                  type="number"
                  min={1}
                  max={10}
                  className="field"
                  value={maxUses}
                  onChange={(event) =>
                    setMaxUses(
                      Math.min(10, Math.max(1, Number(event.target.value) || 1)),
                    )
                  }
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="btn btn-md btn-primary w-full"
                  disabled={createInvite.isPending}
                >
                  {createInvite.isPending && (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  Crear link
                </button>
              </div>
            </form>

            {createInvite.isError && (
              <p role="alert" className="mt-3 text-sm text-danger">
                {getApiErrorMessage(createInvite.error)}
              </p>
            )}

            {createdInvite && (
              <div className="mt-4 rounded-xl border border-accent-line bg-accent-soft p-3.5 text-accent-ink">
                <p className="text-xs font-semibold uppercase tracking-[0.08em]">
                  Link de invitación · {roleLabel(createdInvite.role)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    readOnly
                    value={createdInvite.url}
                    aria-label="Link de invitación"
                    onFocus={(event) => event.currentTarget.select()}
                    className="field min-w-0 flex-1 bg-surface text-xs"
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => void copyInvite()}
                  >
                    <Copy className="size-3.5" aria-hidden="true" />
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  Este link se muestra una sola vez. Quien lo abra e inicie
                  sesión se une al proyecto: compartilo solo con quien querés
                  invitar.
                </p>
              </div>
            )}

            <div className="mt-5">
              <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
                Invitaciones activas
              </h4>
              {invites.isLoading && (
                <div className="mt-2 space-y-2" aria-hidden="true">
                  <div className="skeleton h-10 rounded-lg" />
                </div>
              )}
              {invites.isError && (
                <p role="alert" className="mt-2 text-xs text-danger">
                  {getApiErrorMessage(invites.error)}
                </p>
              )}
              {invites.data && invites.data.length === 0 && (
                <p className="mt-2 text-xs text-ink-muted">
                  No hay invitaciones activas.
                </p>
              )}
              {invites.data && invites.data.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {invites.data.map((invite) => (
                    <li
                      key={invite.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface-muted/60 px-3 py-2 text-xs text-ink-soft"
                    >
                      <span className="chip border border-line bg-surface text-ink-soft">
                        {roleLabel(invite.role)}
                      </span>
                      <span>Vence {formatDate(invite.expiresAt)}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        Usos {invite.uses}/{invite.maxUses}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost ml-auto text-danger"
                        onClick={() => revokeInvite.mutate(invite.id)}
                        disabled={revokeInvite.isPending}
                      >
                        Revocar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
