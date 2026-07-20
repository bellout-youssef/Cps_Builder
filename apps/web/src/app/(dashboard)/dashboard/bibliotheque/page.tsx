'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Header } from '@/components/layout/header';
import { Spinner } from '@/components/ui/spinner';
import { ViewToggle, type ViewMode } from '@/components/bibliotheque/view-toggle';
import { SearchBar } from '@/components/bibliotheque/search-bar';
import { ProjectList } from '@/components/bibliotheque/project-list';
import { ProjectTree } from '@/components/bibliotheque/project-tree';
import { ReferentialList } from '@/components/bibliotheque/referential-list';
import { ReferentialTree } from '@/components/bibliotheque/referential-tree';
import { SearchResults } from '@/components/bibliotheque/search-results';
import { getProjects, type ProjectListItem } from '@/lib/api/projects';
import { getSeries, getArticles, type SerieItem, type ArticleItem } from '@/lib/api/referential';
import { globalSearch, type SearchHit } from '@/lib/api/search';
import { useAuth } from '@/contexts/auth-context';
import { WorkflowStep, RoleName } from '@cps/shared';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = 'mes-projets' | 'publies' | 'referentiel' | 'archives' | 'recherche';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'mes-projets', label: 'Mes projets' },
  { id: 'publies', label: 'Projets publiés' },
  { id: 'referentiel', label: 'Référentiel' },
  { id: 'archives', label: 'Archives' },
  { id: 'recherche', label: 'Recherche' },
];

// ─── Main content (needs useSearchParams → must be inside Suspense) ───────────

function BibliothequeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { can, user } = useAuth();

  const tabParam = (searchParams.get('tab') ?? 'mes-projets') as TabId;
  const viewParam = (searchParams.get('view') ?? 'liste') as ViewMode;
  const isAdmin = (user?.roles ?? []).includes(RoleName.ADMIN);

  const [activeTab, setActiveTab] = useState<TabId>(tabParam);
  const [viewMode, setViewMode] = useState<ViewMode>(viewParam);

  // Projects
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Referential
  const [series, setSeries] = useState<SerieItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [refLoading, setRefLoading] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);
  const refLoaded = useRef(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── URL sync ──────────────────────────────────────────────────────────────

  const updateUrl = useCallback(
    (tab: TabId, view: ViewMode) => {
      const params = new URLSearchParams();
      if (tab !== 'mes-projets') params.set('tab', tab);
      if (view !== 'liste') params.set('view', view);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`);
    },
    [router, pathname],
  );

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      updateUrl(tab, viewMode);
    },
    [updateUrl, viewMode],
  );

  const handleViewChange = useCallback(
    (view: ViewMode) => {
      setViewMode(view);
      updateUrl(activeTab, view);
    },
    [updateUrl, activeTab],
  );

  // ─── Load projects ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!can('projects:read')) {
      setProjectsLoading(false);
      return;
    }
    getProjects()
      .then(setProjects)
      .catch((err: unknown) =>
        setProjectsError(err instanceof Error ? err.message : 'Erreur de chargement'),
      )
      .finally(() => setProjectsLoading(false));
  }, [can]);

  // ─── Load referential (lazy — only when tab is opened) ────────────────────

  useEffect(() => {
    if (activeTab !== 'referentiel') return;
    if (refLoaded.current) return;
    if (!can('referential:read')) return;

    refLoaded.current = true;
    setRefLoading(true);

    Promise.all([getSeries(), getArticles()])
      .then(([s, a]) => {
        setSeries(s);
        setArticles(a);
      })
      .catch((err: unknown) =>
        setRefError(err instanceof Error ? err.message : 'Erreur de chargement'),
      )
      .finally(() => setRefLoading(false));
  }, [activeTab, can]);

  // ─── Debounced search ──────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.length < 2) {
      setSearchHits([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      globalSearch(searchQuery)
        .then((res) => {
          setSearchHits(res.results);
          setSearchError(null);
        })
        .catch((err: unknown) =>
          setSearchError(err instanceof Error ? err.message : 'Erreur de recherche'),
        )
        .finally(() => setSearchLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // ─── Derived data ──────────────────────────────────────────────────────────

  const myProjects = projects.filter(
    (p) => p.workflowStep !== WorkflowStep.PUBLISHED && p.workflowStep !== WorkflowStep.ARCHIVED,
  );
  const published = projects.filter((p) => p.workflowStep === WorkflowStep.PUBLISHED);
  const archived = projects.filter((p) => p.workflowStep === WorkflowStep.ARCHIVED);

  // ─── Render helpers ────────────────────────────────────────────────────────

  function renderProjectTab(list: ProjectListItem[], empty: string) {
    if (projectsLoading)
      return (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      );
    if (projectsError)
      return <p className="py-10 text-center text-sm text-red-500">{projectsError}</p>;
    return viewMode === 'liste' ? (
      <ProjectList projects={list} emptyMessage={empty} currentUserId={user?.sub} isAdmin={isAdmin} />
    ) : (
      <ProjectTree projects={list} emptyMessage={empty} />
    );
  }

  function renderReferentialTab() {
    if (!can('referential:read'))
      return <p className="py-12 text-center text-sm italic text-slate-400">Accès non autorisé.</p>;
    if (refLoading)
      return (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      );
    if (refError) return <p className="py-10 text-center text-sm text-red-500">{refError}</p>;
    return viewMode === 'liste' ? (
      <ReferentialList series={series} articles={articles} />
    ) : (
      <ReferentialTree series={series} articles={articles} />
    );
  }

  // ─── Visible tabs ──────────────────────────────────────────────────────────

  const visibleTabs = TABS.filter(({ id }) => {
    if (id === 'referentiel') return can('referential:read');
    return true;
  });

  const showViewToggle = activeTab !== 'recherche';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Bibliothèque" />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Global search bar */}
        <SearchBar
          value={searchQuery}
          onChange={(q) => {
            setSearchQuery(q);
            if (q.length >= 2 && activeTab !== 'recherche') handleTabChange('recherche');
            if (!q && activeTab === 'recherche') handleTabChange('mes-projets');
          }}
          className="mb-6 max-w-2xl"
        />

        {/* Tab bar + view toggle */}
        <div className="mb-5 flex items-end justify-between">
          <div className="flex border-b border-slate-200">
            {visibleTabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={clsx(
                  '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                  activeTab === id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {showViewToggle && <ViewToggle value={viewMode} onChange={handleViewChange} />}
        </div>

        {/* Tab content */}
        {activeTab === 'mes-projets' && renderProjectTab(myProjects, 'Aucun projet en cours')}
        {activeTab === 'publies' && renderProjectTab(published, 'Aucun projet publié')}
        {activeTab === 'referentiel' && renderReferentialTab()}
        {activeTab === 'archives' && renderProjectTab(archived, 'Aucun projet archivé')}
        {activeTab === 'recherche' && (
          <SearchResults
            hits={searchHits}
            query={searchQuery}
            loading={searchLoading}
            error={searchError}
          />
        )}
      </main>
    </div>
  );
}

// ─── Page export with Suspense boundary ───────────────────────────────────────

export default function BibliothequePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 items-center justify-center">
            <Spinner size="lg" />
          </div>
        </div>
      }
    >
      <BibliothequeContent />
    </Suspense>
  );
}
