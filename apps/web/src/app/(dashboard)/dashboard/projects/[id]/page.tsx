'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  History,
  ClipboardList,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react';
import { WorkflowStep, WorkflowAction } from '@cps/shared';
import { useAuth } from '@/contexts/auth-context';
import {
  getProject,
  sendForReview,
  requestModification,
  rejectProject,
  publishProject,
  type ProjectDetail,
} from '@/lib/api/projects';
import { getOrgMembers, type OrgMember } from '@/lib/api/admin';
import {
  generatePreview,
  listDocuments,
  downloadDocument,
  type ProjectDocument,
} from '@/lib/api/documents';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { WorkflowStatusBar } from '@/components/workflow/workflow-status-bar';
import { WorkflowActions } from '@/components/workflow/workflow-actions';
import { WorkflowHistory } from '@/components/workflow/workflow-history';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STEP_LABEL: Record<WorkflowStep, string> = {
  [WorkflowStep.CREATION]: 'En création',
  [WorkflowStep.PENDING_REVIEW]: 'En vérification',
  [WorkflowStep.ADMIN_REVIEW]: 'Validation admin',
  [WorkflowStep.PUBLISHED]: 'Publié',
  [WorkflowStep.ARCHIVED]: 'Archivé',
};

const STEP_BADGE: Record<WorkflowStep, BadgeVariant> = {
  [WorkflowStep.CREATION]: 'default',
  [WorkflowStep.PENDING_REVIEW]: 'warning',
  [WorkflowStep.ADMIN_REVIEW]: 'warning',
  [WorkflowStep.PUBLISHED]: 'success',
  [WorkflowStep.ARCHIVED]: 'default',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'apercu' | 'clauses' | 'historique';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const { user, can } = useAuth();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('apercu');
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const loadProject = useCallback(() => {
    if (!params?.id) return;
    setLoading(true);
    setError(null);
    getProject(params.id)
      .then(setProject)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Erreur de chargement'),
      )
      .finally(() => setLoading(false));
  }, [params?.id]);

  const loadDocuments = useCallback(() => {
    if (!params?.id) return;
    listDocuments(params.id).then(setDocuments).catch(() => {});
  }, [params?.id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (can('projects:read')) {
      getOrgMembers()
        .then(setOrgMembers)
        .catch(() => {});
    }
  }, [can]);

  async function handleGeneratePreview() {
    if (!project) return;
    setGenerating(true);
    setGenError(null);
    try {
      await generatePreview(project.id);
      await loadDocuments();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Erreur de génération');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(type: string) {
    if (!project) return;
    setDownloadingType(type);
    try {
      await downloadDocument(project.id, type);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Erreur de téléchargement');
    } finally {
      setDownloadingType(null);
    }
  }

  async function handleTransition(
    action: WorkflowAction,
    opts?: { targetUserId?: string; reason?: string },
  ) {
    if (!project) return;
    let updated: ProjectDetail;

    switch (action) {
      case WorkflowAction.SEND_TO_USER:
      case WorkflowAction.SEND_TO_ADMIN:
        updated = await sendForReview(project.id, opts ?? {});
        break;
      case WorkflowAction.REQUEST_MODIFICATION:
        updated = await requestModification(project.id, opts?.reason);
        break;
      case WorkflowAction.REJECT:
        updated = await rejectProject(project.id, opts?.reason);
        break;
      case WorkflowAction.PUBLISH:
        updated = await publishProject(project.id);
        break;
      default:
        return;
    }

    setProject(updated);
  }

  if (!can('projects:read')) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="Projet" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-500">Accès non autorisé.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title={project?.name ?? 'Projet'} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-5">
          {/* Back link */}
          <Link
            href="/dashboard/bibliotheque"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la bibliothèque
          </Link>

          {loading && (
            <div className="flex h-64 items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {project && !loading && (
            <>
              {/* Header card */}
              <Card>
                <CardBody className="pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
                        {project.code && (
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                            {project.code}
                          </span>
                        )}
                        <Badge variant={STEP_BADGE[project.workflowStep]}>
                          {STEP_LABEL[project.workflowStep]}
                        </Badge>
                      </div>
                      {project.description && (
                        <p className="text-sm text-slate-500">{project.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                        <span>Types : {project.types.map((t) => t.type).join(', ')}</span>
                        <span>·</span>
                        <span>Créé le {fmtDate(project.createdAt)}</span>
                        {project.publishedAt && (
                          <>
                            <span>·</span>
                            <span>Publié le {fmtDate(project.publishedAt)}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{project.isPrivate ? 'Privé' : 'Partagé'}</span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Workflow pipeline */}
              <WorkflowStatusBar currentStep={project.workflowStep} />

              {/* Actions */}
              {user && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-indigo-500" />
                      <CardTitle>Actions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <WorkflowActions
                      project={project}
                      user={user}
                      orgMembers={orgMembers}
                      onTransition={handleTransition}
                    />
                  </CardBody>
                </Card>
              )}

              {/* Documents CPS */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-indigo-500" />
                      <CardTitle>Documents CPS</CardTitle>
                    </div>
                    {project.workflowStep !== WorkflowStep.PUBLISHED && (
                      <button
                        type="button"
                        onClick={handleGeneratePreview}
                        disabled={generating}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {generating ? (
                          <>
                            <Spinner size="sm" />
                            Génération…
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5" />
                            Générer le CPS
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardBody>
                  {genError && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{genError}</p>
                  )}
                  {documents.length === 0 ? (
                    <p className="py-4 text-center text-sm italic text-slate-400">
                      {project.workflowStep === WorkflowStep.PUBLISHED
                        ? 'Documents en cours de génération…'
                        : 'Aucun document généré — cliquez sur « Générer le CPS » pour créer un aperçu.'}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {documents.map((doc) => {
                        const typeKey = doc.type === 'BDP_EXCEL' ? 'bdp' : doc.type === 'ESTIM_EXCEL' ? 'estim' : doc.type.toLowerCase();
                        const label = { html: 'HTML', docx: 'DOCX', pdf: 'PDF', bdp: 'BDP Excel', estim: 'Estimation Excel' }[typeKey] ?? doc.type;
                        const isDownloading = downloadingType === typeKey;
                        return (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => handleDownload(typeKey)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                          >
                            {isDownloading ? <Spinner size="sm" /> : <Download className="h-3.5 w-3.5 text-slate-400" />}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Tabs */}
              <div>
                <nav className="flex gap-1 border-b border-slate-200">
                  {(
                    [
                      { id: 'apercu', label: 'Aperçu', icon: <Eye className="h-4 w-4" /> },
                      { id: 'clauses', label: 'Clauses', icon: <FileText className="h-4 w-4" /> },
                      { id: 'historique', label: 'Historique', icon: <History className="h-4 w-4" /> },
                    ] as { id: Tab; label: string; icon: React.ReactNode }[]
                  ).map(({ id, label, icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                        tab === id
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </nav>

                <div className="pt-5">
                  {tab === 'apercu' && <AperçuTab project={project} />}
                  {tab === 'clauses' && <ClausesTab project={project} />}
                  {tab === 'historique' && (
                    <Card>
                      <CardBody className="pt-5">
                        <WorkflowHistory history={project.workflowHistory ?? []} />
                      </CardBody>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Aperçu tab ───────────────────────────────────────────────────────────────

function AperçuTab({ project }: { project: ProjectDetail }) {
  const answers = project.chapter2Answers;
  const hasAnswers = answers !== null && Object.keys(answers).length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Résumé</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Clauses</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {(project.clauses ?? []).length > 0 ? `${(project.clauses ?? []).length} clauses` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Types</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {project.types.map((t) => t.type).join(', ') || '—'}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      {hasAnswers && answers && (
        <Card>
          <CardHeader>
            <CardTitle>Questionnaire CPS</CardTitle>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.entries(answers)
                .filter(([, v]) => typeof v === 'string' && v !== '')
                .map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs font-medium text-slate-400">{key.replace(/_/g, ' ')}</dt>
                    <dd className="mt-0.5 text-sm text-slate-700">{String(value) || '—'}</dd>
                  </div>
                ))}
            </dl>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ─── Clauses tab ──────────────────────────────────────────────────────────────

function ClausesTab({ project }: { project: ProjectDetail }) {
  const clauses = project.clauses ?? [];

  if (clauses.length === 0) {
    return (
      <Card>
        <CardBody className="pt-5">
          <p className="py-4 text-center text-sm italic text-slate-400">Aucune clause enregistrée.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="pt-5">
        <ul className="divide-y divide-slate-100">
          {clauses
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((clause) => (
              <li key={clause.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{clause.code}</span>
                      <p className="text-sm font-semibold text-slate-800">{clause.title}</p>
                      {clause.isLocallyModified && (
                        <Badge variant="warning">Modifié localement</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-3 whitespace-pre-wrap">
                      {clause.localContent ?? clause.content}
                    </p>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      </CardBody>
    </Card>
  );
}
