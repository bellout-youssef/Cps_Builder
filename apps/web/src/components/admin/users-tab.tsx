'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import {
  getUsers,
  createUser,
  updateUserRoles,
  deactivateUser,
  reactivateUser,
  resetUserPassword,
} from '@/lib/api/admin';
import type { UserItem } from '@/lib/api/admin';

const ALL_ROLES = [
  { value: 'ORG_ADMIN', label: 'Admin Organisation' },
  { value: 'REF_MANAGER', label: 'Resp. Référentiel' },
  { value: 'CREATOR', label: 'Créateur' },
  { value: 'VERIFIER', label: 'Vérificateur' },
  { value: 'VALIDATOR', label: 'Validateur' },
];

const ROLE_LABELS: Record<string, string> = {
  ORG_ADMIN: 'Admin Org',
  REF_MANAGER: 'Resp. Réf.',
  CREATOR: 'Créateur',
  VERIFIER: 'Vérificateur',
  VALIDATOR: 'Validateur',
};

function RolesCheckboxes({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (roles: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {ALL_ROLES.map((r) => (
        <label
          key={r.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
        >
          <input
            type="checkbox"
            checked={selected.includes(r.value)}
            onChange={(e) => {
              onChange(
                e.target.checked ? [...selected, r.value] : selected.filter((v) => v !== r.value),
              );
            }}
            className="rounded border-slate-300"
          />
          {r.label}
        </label>
      ))}
    </div>
  );
}

function FormError({ children }: { children: ReactNode }) {
  return <p className="text-xs text-red-600">{children}</p>;
}

function ModalActions({
  onCancel,
  onConfirm,
  loading,
  confirmLabel = 'Enregistrer',
}: {
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
  confirmLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-3 pt-1">
      <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
        Annuler
      </Button>
      <Button size="sm" onClick={onConfirm} loading={loading}>
        {confirmLabel}
      </Button>
    </div>
  );
}

export function UsersTab() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRoles, setCreateRoles] = useState<string[]>([]);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Roles modal state
  const [rolesTarget, setRolesTarget] = useState<UserItem | null>(null);
  const [rolesSelected, setRolesSelected] = useState<string[]>([]);
  const [rolesSaving, setRolesSaving] = useState(false);

  // Reset password modal state
  const [resetTarget, setResetTarget] = useState<UserItem | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Deactivate confirm state
  const [deactivateTarget, setDeactivateTarget] = useState<UserItem | null>(null);
  const [deactivateSaving, setDeactivateSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await getUsers());
    } catch {
      setError('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate() {
    if (!createEmail || !createPassword || createRoles.length === 0) {
      setCreateError('Email, mot de passe temporaire et au moins un rôle sont obligatoires.');
      return;
    }
    setCreateSaving(true);
    setCreateError(null);
    try {
      const user = await createUser({
        email: createEmail,
        temporaryPassword: createPassword,
        roles: createRoles,
      });
      setUsers((prev) => [...prev, user]);
      setCreateOpen(false);
      setCreateEmail('');
      setCreatePassword('');
      setCreateRoles([]);
    } catch {
      setCreateError('Erreur lors de la création.');
    } finally {
      setCreateSaving(false);
    }
  }

  function openRoles(user: UserItem) {
    setRolesTarget(user);
    setRolesSelected(user.roles);
  }

  async function handleRolesSave() {
    if (!rolesTarget) return;
    setRolesSaving(true);
    try {
      const updated = await updateUserRoles(rolesTarget.id, rolesSelected);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setRolesTarget(null);
    } catch {
      // keep modal open on error
    } finally {
      setRolesSaving(false);
    }
  }

  function openReset(user: UserItem) {
    setResetTarget(user);
    setResetPassword('');
    setResetError(null);
  }

  async function handleResetPassword() {
    if (!resetTarget || !resetPassword) {
      setResetError('Mot de passe obligatoire.');
      return;
    }
    setResetSaving(true);
    setResetError(null);
    try {
      await resetUserPassword(resetTarget.id, resetPassword);
      setResetTarget(null);
      setResetPassword('');
    } catch {
      setResetError('Erreur lors de la réinitialisation.');
    } finally {
      setResetSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivateSaving(true);
    try {
      await deactivateUser(deactivateTarget.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === deactivateTarget.id ? { ...u, isActive: false } : u)),
      );
      setDeactivateTarget(null);
    } catch {
      // keep confirm open on error
    } finally {
      setDeactivateSaving(false);
    }
  }

  async function handleReactivate(user: UserItem) {
    try {
      await reactivateUser(user.id);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: true } : u)));
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-600">{users.length} utilisateur(s)</p>
        <Button
          size="sm"
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
        >
          + Créer un utilisateur
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Rôles</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Statut</th>
              <th className="px-4 py-3 text-right font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-900">
                  {user.email}
                  {user.mustChangePassword && (
                    <span className="ml-2 text-xs text-amber-600">• mdp temp.</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                      <Badge key={r} variant="info">
                        {ROLE_LABELS[r] ?? r}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {user.isActive ? (
                    <Badge variant="success">Actif</Badge>
                  ) : (
                    <Badge variant="danger">Inactif</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openRoles(user)}>
                      Rôles
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openReset(user)}>
                      Réinit. MDP
                    </Button>
                    {user.isActive ? (
                      <Button variant="ghost" size="sm" onClick={() => setDeactivateTarget(user)}>
                        Désactiver
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => void handleReactivate(user)}>
                        Réactiver
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">Aucun utilisateur.</p>
        )}
      </div>

      {/* Create user modal */}
      <Modal open={createOpen} title="Créer un utilisateur" onClose={() => setCreateOpen(false)}>
        <div className="space-y-4">
          <Input
            label="Email"
            id="create-email"
            type="email"
            value={createEmail}
            onChange={(e) => setCreateEmail(e.target.value)}
          />
          <Input
            label="Mot de passe temporaire"
            id="create-password"
            type="text"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
          />
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Rôles</p>
            <RolesCheckboxes selected={createRoles} onChange={setCreateRoles} />
          </div>
          {createError && <FormError>{createError}</FormError>}
          <ModalActions
            onCancel={() => setCreateOpen(false)}
            onConfirm={() => void handleCreate()}
            loading={createSaving}
            confirmLabel="Créer"
          />
        </div>
      </Modal>

      {/* Edit roles modal */}
      <Modal
        open={rolesTarget !== null}
        title="Modifier les rôles"
        onClose={() => setRolesTarget(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{rolesTarget?.email}</p>
          <RolesCheckboxes selected={rolesSelected} onChange={setRolesSelected} />
          <ModalActions
            onCancel={() => setRolesTarget(null)}
            onConfirm={() => void handleRolesSave()}
            loading={rolesSaving}
          />
        </div>
      </Modal>

      {/* Reset password modal */}
      <Modal
        open={resetTarget !== null}
        title="Réinitialiser le mot de passe"
        onClose={() => setResetTarget(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{resetTarget?.email}</p>
          <Input
            label="Nouveau mot de passe temporaire"
            id="reset-password"
            type="text"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
          />
          {resetError && <FormError>{resetError}</FormError>}
          <ModalActions
            onCancel={() => setResetTarget(null)}
            onConfirm={() => void handleResetPassword()}
            loading={resetSaving}
            confirmLabel="Réinitialiser"
          />
        </div>
      </Modal>

      {/* Deactivate confirmation */}
      <Modal
        open={deactivateTarget !== null}
        title="Désactiver l'utilisateur"
        onClose={() => setDeactivateTarget(null)}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Confirmer la désactivation de <strong>{deactivateTarget?.email}</strong> ?
          </p>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              Cet utilisateur peut être affecté à des projets en cours. Sa désactivation conserve
              l&apos;historique. Pensez à réaffecter ses projets si nécessaire.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeactivateTarget(null)}
              disabled={deactivateSaving}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void handleDeactivate()}
              loading={deactivateSaving}
            >
              Désactiver
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
