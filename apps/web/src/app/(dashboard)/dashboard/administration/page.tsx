'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/auth-context';
import { UsersTab } from '@/components/admin/users-tab';
import { SettingsTab } from '@/components/admin/settings-tab';

type Tab = 'utilisateurs' | 'parametres';

const TABS: { id: Tab; label: string; permission: 'users:manage' | 'settings:manage' }[] = [
  { id: 'utilisateurs', label: 'Utilisateurs', permission: 'users:manage' },
  { id: 'parametres', label: 'Paramètres', permission: 'settings:manage' },
];

export default function AdministrationPage() {
  const { can } = useAuth();

  const visibleTabs = TABS.filter((t) => can(t.permission));
  const [activeTab, setActiveTab] = useState<Tab>(visibleTabs[0]?.id ?? 'utilisateurs');

  if (visibleTabs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Accès non autorisé.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-8 pt-6">
        <h1 className="text-xl font-semibold text-slate-900">Administration</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Gestion des utilisateurs et paramètres de l'organisation.
        </p>

        {/* Tabs */}
        <nav className="mt-4 flex gap-1">
          {visibleTabs.map((tab) => (
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
        {activeTab === 'utilisateurs' && can('users:manage') && <UsersTab />}
        {activeTab === 'parametres' && can('settings:manage') && <SettingsTab />}
      </div>
    </div>
  );
}
