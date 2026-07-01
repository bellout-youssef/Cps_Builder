'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/lib/api/notifications';
import type { NotificationItem } from '@/lib/api/notifications';

const TYPE_LABELS: Record<string, string> = {
  WORKFLOW_SUBMITTED: 'Soumis au flux',
  WORKFLOW_APPROVED: 'Approuvé',
  WORKFLOW_REJECTED: 'Rejeté',
  WORKFLOW_MODIFICATION_REQUESTED: 'Modification demandée',
  CPS_PUBLISHED: 'CPS publié',
  CLAUSE_UPDATED: 'Clause mise à jour',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      setItems(await getNotifications());
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleMarkRead(id: string) {
    try {
      await markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est à jour.'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleMarkAllRead()}
              loading={markingAll}
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-slate-50 p-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <Bell className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-medium text-red-700">{loadError}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Bell className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">Aucune notification</p>
            <p className="mt-1 text-xs text-slate-500">
              Les notifications apparaissent ici lors des événements liés à vos projets.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 rounded-lg border bg-white p-4 shadow-sm transition-colors ${
                  notif.isRead ? 'border-slate-200' : 'border-indigo-200 bg-indigo-50/30'
                }`}
              >
                {/* Unread indicator */}
                <div className="mt-1 flex-shrink-0">
                  {notif.isRead ? (
                    <div className="h-2 w-2 rounded-full bg-slate-200" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={notif.isRead ? 'default' : 'info'}>
                      {TYPE_LABELS[notif.type] ?? notif.type}
                    </Badge>
                    <span className="text-xs text-slate-400">{formatDate(notif.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-800">{notif.title}</p>
                  {notif.message && <p className="mt-0.5 text-sm text-slate-600">{notif.message}</p>}
                  {notif.projectId && (
                    <Link
                      href={`/dashboard/projects/${notif.projectId}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Voir le projet
                    </Link>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-1">
                  {!notif.isRead && (
                    <button
                      type="button"
                      title="Marquer comme lu"
                      onClick={() => void handleMarkRead(notif.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Supprimer"
                    onClick={() => void handleDelete(notif.id)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
