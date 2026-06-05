'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { getMonitoringStats } from '@/lib/api/admin';
import type { MonitoringStats } from '@/lib/api/admin';

const TILES: { key: keyof MonitoringStats; label: string }[] = [
  { key: 'totalOrgs', label: 'Organisations' },
  { key: 'totalUsers', label: 'Utilisateurs' },
  { key: 'totalProjects', label: 'Projets CPS' },
  { key: 'activeSubscriptions', label: 'Abonnements actifs' },
];

export function MonitoringTab() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMonitoringStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <p className="py-8 text-center text-sm text-slate-500">Données indisponibles.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {TILES.map(({ key, label }) => (
        <Card key={key}>
          <CardBody>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats[key]}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
