'use client';

import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import type { ProjectListItem } from '@/lib/api/projects';
import { WorkflowStep } from '@cps/shared';
import { generatePreview, downloadDocument } from '@/lib/api/documents';

type BtnState = 'idle' | 'generating' | 'ready' | 'error';

interface GenerateCpsButtonProps {
  project: ProjectListItem;
  currentUserId?: string;
  isAdmin: boolean;
}

function canGenerate(
  project: ProjectListItem,
  currentUserId: string | undefined,
  isAdmin: boolean,
): boolean {
  const uid = currentUserId;
  switch (project.workflowStep) {
    case WorkflowStep.PUBLISHED:
      return true;
    case WorkflowStep.CREATION:
    case WorkflowStep.PENDING_REVIEW:
      return !!uid && (uid === project.createdById || uid === project.currentHolderId);
    case WorkflowStep.ADMIN_REVIEW:
      return !!uid && (uid === project.createdById || isAdmin);
    default:
      return false;
  }
}

export function GenerateCpsButton({ project, currentUserId, isAdmin }: GenerateCpsButtonProps) {
  const [state, setState] = useState<BtnState>('idle');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canGenerate(project, currentUserId, isAdmin)) return null;

  const isPublished = project.workflowStep === WorkflowStep.PUBLISHED;

  async function handleGenerate() {
    if (isPublished) {
      // Documents already exist — skip generation, go straight to download options
      setState('ready');
      return;
    }
    setState('generating');
    setError(null);
    try {
      await generatePreview(project.id);
      setState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de génération');
      setState('error');
    }
  }

  async function handleDownload(type: 'html' | 'docx') {
    setDownloading(type);
    try {
      await downloadDocument(project.id, type);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de téléchargement');
      setState('error');
    } finally {
      setDownloading(null);
    }
  }

  if (state === 'generating') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Génération…
      </span>
    );
  }

  if (state === 'ready') {
    return (
      <div className="inline-flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => handleDownload('html')}
          disabled={downloading !== null}
          className="inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
        >
          {downloading === 'html' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          HTML
        </button>
        <span className="text-slate-300 select-none">|</span>
        <button
          type="button"
          onClick={() => handleDownload('docx')}
          disabled={downloading !== null}
          className="inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
        >
          {downloading === 'docx' ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          DOCX
        </button>
        <button
          type="button"
          onClick={() => { setState('idle'); setError(null); }}
          className="ml-0.5 rounded px-1 py-0.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    );
  }

  // idle or error
  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={handleGenerate}
        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
      >
        <FileDown className="h-3.5 w-3.5" />
        {isPublished ? 'Télécharger' : 'Générer le CPS'}
      </button>
      {error && (
        <p className="max-w-[14rem] text-right text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
