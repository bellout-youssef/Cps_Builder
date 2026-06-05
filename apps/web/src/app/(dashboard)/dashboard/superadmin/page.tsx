'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/auth-context';
import { OrgsTab } from '@/components/superadmin/orgs-tab';
import { MonitoringTab } from '@/components/superadmin/monitoring-tab';
import { SubscriptionsTab } from '@/components/superadmin/subscriptions-tab';

type Tab = 'organisations' | 'abonnements' | 'licences' | 'monitoring' | 'support';

const TABS: { id: Tab; label: string }[] = [
  { id: 'organisations', label: 'Organisations' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'abonnements', label: 'Abonnements' },
  { id: 'licences', label: 'Licences' },
  { id: 'support', label: 'Support' },
];

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <span className="text-xl">🔧</span>
      </div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Disponible dans une prochaine version.</p>
    </div>
  );
}

export default function SuperAdminPage() {
  const { can } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('organisations');

  if (!can('org:manage')) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Accès réservé aux super administrateurs.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-8 pt-6">
        <h1 className="text-xl font-semibold text-slate-900">Super Administration</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Gestion de la plateforme — organisations, abonnements, licences, monitoring.
        </p>

        {/* Tabs */}
        <nav className="mt-4 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-8">
        {activeTab === 'organisations' && <OrgsTab />}
        {activeTab === 'monitoring' && <MonitoringTab />}
        {activeTab === 'abonnements' && <SubscriptionsTab />}
        {activeTab === 'licences' && <PlaceholderTab label="Gestion des licences" />}
        {activeTab === 'support' && <PlaceholderTab label="Accès support" />}
      </div>
    </div>
  );
}
