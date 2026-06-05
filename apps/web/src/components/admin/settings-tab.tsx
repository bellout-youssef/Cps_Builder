'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getOrgSettings, updateOrgSettings } from '@/lib/api/admin';
import type { OrgSettings } from '@/lib/api/admin';

export function SettingsTab() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getOrgSettings()
      .then((s) => {
        setSettings(s);
        setName(s.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const updated = await updateOrgSettings({ name });
      setSettings(updated);
      setName(updated.name);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-6">
      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">Identifiant (slug)</p>
        <p className="font-mono text-sm text-slate-500">{settings?.slug}</p>
        <p className="mt-1 text-xs text-slate-400">Non modifiable.</p>
      </div>

      <Input
        label="Nom de l'organisation"
        id="org-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {saveError && <p className="text-xs text-red-600">{saveError}</p>}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => void handleSave()} loading={saving}>
          Enregistrer
        </Button>
        {saved && <p className="text-xs text-green-600">Enregistré ✓</p>}
      </div>
    </div>
  );
}
