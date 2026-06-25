'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  BookOpen,
  FolderPlus,
  Library,
  Settings,
  Bell,
  FileText,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import type { ElementType } from 'react';
import { useAuth } from '@/contexts/auth-context';
import type { Permission } from '@cps/shared';

interface NavItem {
  label: string;
  href: string;
  icon: ElementType;
  permission?: Permission | Permission[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Accueil',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Bibliothèque',
    href: '/dashboard/bibliotheque',
    icon: BookOpen,
    permission: 'projects:read',
  },
  {
    label: 'Nouveau Projet',
    href: '/dashboard/nouveau-projet',
    icon: FolderPlus,
    permission: 'projects:create',
  },
  {
    label: 'Référentiel',
    href: '/dashboard/referentiel',
    icon: Library,
    permission: 'referential:read',
  },
  {
    label: 'Administration',
    href: '/dashboard/administration',
    icon: Settings,
    permission: ['users:manage', 'settings:manage'],
  },
  {
    label: 'Super Admin',
    href: '/dashboard/superadmin',
    icon: ShieldCheck,
    permission: 'org:manage',
  },
  {
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
  },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN: 'Administrateur',
  USER: 'Utilisateur',
};

export function Sidebar() {
  const pathname = usePathname();
  const { can, canAny, user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(({ permission }) => {
    if (!permission) return true;
    if (Array.isArray(permission)) return canAny(permission);
    return can(permission);
  });

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-slate-900">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <FileText className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">CPS Builder</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {visibleItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            const isExactDashboard = href === '/dashboard' && pathname !== '/dashboard';
            const active = isActive && !isExactDashboard;
            const rootActive = href === '/dashboard' && pathname === '/dashboard';
            const highlight = active || rootActive;

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={clsx(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    highlight
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {highlight && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-700/50 p-3">
        <div className="rounded-lg bg-slate-800/50 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-slate-200">{user?.email}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {user?.roles.map((r) => ROLE_LABELS[r] ?? r).join(' · ')}
          </p>
        </div>
      </div>
    </aside>
  );
}
