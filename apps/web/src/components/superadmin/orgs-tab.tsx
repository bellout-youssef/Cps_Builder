'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { getOrganizations, createOrganization } from '@/lib/api/admin';
import type { OrgItem } from '@/lib/api/admin';

export function OrgsTab() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    getOrganizations()
      .then(setOrgs)
      .catch(() => setError('Impossible de charger les organisations.'))
      .finally(() => setLoading(false));
  }, []);

  function handleSlugInput(value: string) {
    setCreateSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  }

  async function handleCreate() {
    if (!createName || !createSlug) {
      setCreateError('Nom et identifiant obligatoires.');
      return;
    }
    setCreateSaving(true);
    setCreateError(null);
    try {
      const org = await createOrganization({ name: createName, slug: createSlug });
      setOrgs((prev) => [...prev, org]);
      setCreateOpen(false);
      setCreateName('');
      setCreateSlug('');
    } catch {
      setCreateError('Erreur lors de la création.');
    } finally {
      setCreateSaving(false);
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
        <p className="text-sm text-slate-600">{orgs.length} organisation(s)</p>
        <Button
          size="sm"
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
        >
          + Nouvelle organisation
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Nom</th>
              <th className="px-4 py-3 text-left font-medium text-slate-700">Slug</th>
              <th className="px-4 py-3 text-right font-medium text-slate-700">Utilisateurs</th>
              <th className="px-4 py-3 text-right font-medium text-slate-700">Projets</th>
              <th className="px-4 py-3 text-right font-medium text-slate-700">Créé le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orgs.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{org.name}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{org.slug}</td>
                <td className="px-4 py-3 text-right text-slate-600">{org.userCount}</td>
                <td className="px-4 py-3 text-right text-slate-600">{org.projectCount}</td>
                <td className="px-4 py-3 text-right text-slate-500">
                  {new Date(org.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orgs.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">Aucune organisation.</p>
        )}
      </div>

      <Modal open={createOpen} title="Nouvelle organisation" onClose={() => setCreateOpen(false)}>
        <div className="space-y-4">
          <Input
            label="Nom"
            id="org-create-name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
          <Input
            label="Identifiant (slug)"
            id="org-create-slug"
            value={createSlug}
            onChange={(e) => handleSlugInput(e.target.value)}
            placeholder="ex: tmpa"
          />
          {createError && <p className="text-xs text-red-600">{createError}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCreateOpen(false)}
              disabled={createSaving}
            >
              Annuler
            </Button>
            <Button size="sm" onClick={() => void handleCreate()} loading={createSaving}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
