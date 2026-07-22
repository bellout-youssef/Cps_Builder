'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { ProjectType } from '@cps/shared';
import { useAuth } from '@/contexts/auth-context';
import {
  createProject,
  getProject,
  saveQuestionnaireDraft,
  updateProject,
} from '@/lib/api/projects';
import { Header } from '@/components/layout/header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { WizardProgress } from '@/components/nouveau-projet/wizard-progress';
import { EMPTY_QUESTIONNAIRE, type CpsQuestionnaire } from '@/components/nouveau-projet/cps-questionnaire.types';
import { Step1Projet, type Step1ProjectData, type Step1Errors } from '@/components/nouveau-projet/steps/step-1-projet';
import { Step2Mo } from '@/components/nouveau-projet/steps/step-2-mo';
import { Step3Objet, type Step3Errors } from '@/components/nouveau-projet/steps/step-3-objet';
import { Step4Intervenants } from '@/components/nouveau-projet/steps/step-4-intervenants';
import { Step5Consistance } from '@/components/nouveau-projet/steps/step-5-consistance';
import { Step6Delai } from '@/components/nouveau-projet/steps/step-6-delai';
import { Step7Penalites } from '@/components/nouveau-projet/steps/step-7-penalites';
import { Step8Revision } from '@/components/nouveau-projet/steps/step-8-revision';
import { Step9StApprovi } from '@/components/nouveau-projet/steps/step-9-st-approvi';
import { Step10Variante } from '@/components/nouveau-projet/steps/step-10-variante';
import { Step11ClausesTech } from '@/components/nouveau-projet/steps/step-11-clauses-tech';
import { Step12Prix } from '@/components/nouveau-projet/steps/step-12-prix';

// ─── Steps definition ─────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Projet & AO' },
  { label: 'Maître d\'Ouvrage' },
  { label: 'Objet' },
  { label: 'Intervenants' },
  { label: 'Consistance' },
  { label: 'Délai' },
  { label: 'Pénalités' },
  { label: 'Révision' },
  { label: 'Sous-traitance' },
  { label: 'Variante' },
  { label: 'Ch. III Technique' },
  { label: 'Ch. IV Prix' },
];

const STEP_TITLES = [
  'Projet & Appel d\'Offres',
  'Maître d\'Ouvrage',
  'Objet du marché',
  'Intervenants',
  'Consistance, textes & cautionnement',
  'Délai d\'exécution',
  'Délai de garantie & Pénalités',
  'Révision des prix',
  'Sous-traitance & Approvisionnements',
  'Variante',
  'Clauses techniques — Chapitre III',
  'Définition des prix — Chapitre IV',
];

const STEP_SUBTITLES = [
  'Renseignez les informations générales du projet et les données de l\'appel d\'offres.',
  'Identité du Maître d\'Ouvrage (préambule du CPS).',
  'Objet détaillé et lieu d\'exécution des travaux.',
  'Maître d\'œuvre, bureau de contrôle et autres intervenants.',
  'Description des travaux, textes applicables et cautionnement provisoire.',
  'Type de délai et calendrier d\'exécution.',
  'Durée de la garantie et conditions de pénalités pour retard.',
  'Conditions de révision des prix (fermes ou révisables).',
  'Règles de sous-traitance et acomptes sur approvisionnements.',
  'Conditions d\'application de la variante (Art 2.13).',
  'Prescriptions techniques et documents à fournir.',
  'Liste des articles prix qui constitueront le Chapitre IV.',
];

// ─── State ────────────────────────────────────────────────────────────────────

interface WizardState {
  step1: Step1ProjectData;
  questionnaire: CpsQuestionnaire;
  projectId: string | null;
  dceRef: string | null;
  loadedCreatedById: string | null;
  loadedCurrentHolderId: string | null;
}

const INITIAL_STATE: WizardState = {
  step1: {
    name: '',
    description: '',
    types: [],
    questionnaire: { ao_num: '', ao_title: '', mode_passation: '' },
  },
  questionnaire: EMPTY_QUESTIONNAIRE,
  projectId: null,
  dceRef: null,
  loadedCreatedById: null,
  loadedCurrentHolderId: null,
};

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateStep1(data: Step1ProjectData): Step1Errors {
  const errors: Step1Errors = {};
  if (!data.name.trim()) errors.name = 'Le nom du projet est obligatoire.';
  if (data.types.length === 0) errors.types = 'Sélectionnez au moins un type de projet.';
  if (!data.questionnaire.ao_num.trim()) errors.ao_num = 'Le numéro AO est obligatoire.';
  if (!data.questionnaire.ao_title.trim()) errors.ao_title = 'L\'intitulé du marché est obligatoire.';
  return errors;
}

function validateStep3(q: CpsQuestionnaire): Step3Errors {
  const errors: Step3Errors = {};
  if (!q.objet_detail.trim()) errors.objet_detail = 'L\'objet du marché est obligatoire.';
  return errors;
}

// ─── Inner page (uses useSearchParams — must be wrapped in Suspense) ──────────

function NouveauProjetInner() {
  const { can, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProjectId = searchParams.get('edit');
  const editMode = Boolean(editProjectId);

  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step3Errors, setStep3Errors] = useState<Step3Errors>({});
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(editMode);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  // Load existing project when in edit mode
  useEffect(() => {
    if (!editProjectId) return;
    setLoadingEdit(true);
    getProject(editProjectId)
      .then((project) => {
        const q: CpsQuestionnaire = project.chapter2Answers ?? EMPTY_QUESTIONNAIRE;
        setState({
          projectId: project.id,
          dceRef: project.dceRef,
          loadedCreatedById: project.createdById,
          loadedCurrentHolderId: project.currentHolderId,
          step1: {
            name: project.name,
            description: project.description ?? '',
            types: project.types.map((t) => t.type),
            questionnaire: {
              ao_num: q.ao_num ?? '',
              ao_title: q.ao_title ?? '',
              mode_passation: q.mode_passation ?? '',
            },
          },
          questionnaire: q,
        });
      })
      .catch((err: unknown) =>
        setSaveError(err instanceof Error ? err.message : 'Erreur de chargement du projet.'),
      )
      .finally(() => setLoadingEdit(false));
  }, [editProjectId]);

  // Merge step-specific questionnaire fields into the main questionnaire
  function setQ(partial: Partial<CpsQuestionnaire>) {
    setState((s) => ({ ...s, questionnaire: { ...s.questionnaire, ...partial } }));
  }

  // Auto-save draft after each step advance (fire-and-forget)
  const autosave = useCallback(
    async (projectId: string, questionnaire: CpsQuestionnaire) => {
      setSaving(true);
      setSaveError(null);
      try {
        await saveQuestionnaireDraft(projectId, questionnaire);
        setSaveOk(true);
        setTimeout(() => setSaveOk(false), 2000);
      } catch {
        setSaveError('Sauvegarde automatique échouée. Vos données restent en mémoire.');
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  if (!user) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={editMode ? 'Modifier le projet' : 'Nouveau projet'} />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-slate-500">
            Vous n&apos;avez pas l&apos;autorisation de modifier ce projet.
          </p>
        </main>
      </div>
    );
  }

  if (loadingEdit) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="Modifier le projet" />
        <main className="flex flex-1 items-center justify-center">
          <Spinner size="lg" />
        </main>
      </div>
    );
  }

  const isRelatedToProject =
    editMode &&
    (state.loadedCreatedById === user.sub || state.loadedCurrentHolderId === user.sub);
  if (!can('projects:create') && !isRelatedToProject) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={editMode ? 'Modifier le projet' : 'Nouveau projet'} />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-slate-500">
            Vous n&apos;avez pas l&apos;autorisation de modifier ce projet.
          </p>
        </main>
      </div>
    );
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async function goNext() {
    setSaveError(null);

    // Step 0
    if (currentStep === 0) {
      const errors = validateStep1(state.step1);
      if (Object.keys(errors).length > 0) {
        setStep1Errors(errors);
        return;
      }
      setStep1Errors({});

      if (editMode && state.projectId) {
        // Edit mode: PATCH instead of POST
        setCreating(true);
        try {
          const initialQ: CpsQuestionnaire = {
            ...state.questionnaire,
            ...state.step1.questionnaire,
          };
          await updateProject(state.projectId, {
            name: state.step1.name.trim(),
            description: state.step1.description.trim() || undefined,
            types: state.step1.types as ProjectType[],
          });
          await saveQuestionnaireDraft(state.projectId, initialQ);
          setState((s) => ({ ...s, questionnaire: initialQ }));
          setCurrentStep(1);
        } catch (err: unknown) {
          setSaveError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du projet.');
        } finally {
          setCreating(false);
        }
        return;
      }

      if (!state.projectId) {
        // Create mode: POST
        setCreating(true);
        try {
          const project = await createProject({
            name: state.step1.name.trim(),
            description: state.step1.description.trim() || undefined,
            types: state.step1.types as ProjectType[],
          });

          const initialQ: CpsQuestionnaire = {
            ...state.questionnaire,
            ...state.step1.questionnaire,
          };

          setState((s) => ({
            ...s,
            projectId: project.id,
            dceRef: project.dceRef,
            questionnaire: initialQ,
          }));

          await saveQuestionnaireDraft(project.id, initialQ);
          setCurrentStep(1);
        } catch (err: unknown) {
          setSaveError(err instanceof Error ? err.message : 'Erreur lors de la création du projet.');
        } finally {
          setCreating(false);
        }
        return;
      }
    }

    // Step 2 (Objet) validation
    if (currentStep === 2) {
      const errors = validateStep3(state.questionnaire);
      if (Object.keys(errors).length > 0) {
        setStep3Errors(errors);
        return;
      }
      setStep3Errors({});
    }

    const next = Math.min(currentStep + 1, STEPS.length - 1);

    // Auto-save on each step advance (after project exists)
    if (state.projectId) {
      void autosave(state.projectId, state.questionnaire);
    }

    setCurrentStep(next);
  }

  function goPrev() {
    setSaveError(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(index: number) {
    if (editMode) {
      // En mode édition : toutes les étapes sont accessibles librement
      setSaveError(null);
      setCurrentStep(index);
    } else if (state.projectId && index <= currentStep) {
      // En mode création : seulement les étapes déjà visitées (projet créé)
      setSaveError(null);
      setCurrentStep(index);
    }
  }

  async function handleFinish() {
    if (!state.projectId) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveQuestionnaireDraft(state.projectId, state.questionnaire);
      router.push(`/dashboard/projects/${state.projectId}`);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde finale.');
      setSaving(false);
    }
  }

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const q = state.questionnaire;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title={editMode ? 'Modifier le projet' : 'Nouveau projet'} />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Progress */}
          <WizardProgress
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={goToStep}
            clickableUpTo={editMode ? STEPS.length - 1 : (state.projectId ? currentStep : -1)}
          />

          {/* Step card */}
          <Card>
            <CardBody className="pt-6">
              {/* Step header */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  {STEP_TITLES[currentStep]}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{STEP_SUBTITLES[currentStep]}</p>
              </div>

              {/* Step content */}
              {currentStep === 0 && (
                <Step1Projet
                  data={state.step1}
                  dceRef={state.dceRef}
                  onChange={(step1) => setState((s) => ({ ...s, step1 }))}
                  errors={step1Errors}
                />
              )}
              {currentStep === 1 && (
                <Step2Mo
                  data={{ mo_capital: q.mo_capital, mo_rc: q.mo_rc, mo_ice: q.mo_ice, mo_if: q.mo_if, mo_siege: q.mo_siege, mo_dg: q.mo_dg }}
                  onChange={(d) => setQ(d)}
                />
              )}
              {currentStep === 2 && (
                <Step3Objet
                  data={{ objet_detail: q.objet_detail, lieu_exec: q.lieu_exec }}
                  onChange={(d) => setQ(d)}
                  errors={step3Errors}
                />
              )}
              {currentStep === 3 && (
                <Step4Intervenants
                  data={{ int_mo: q.int_mo, int_moe: q.int_moe, int_bc: q.int_bc, int_topo: q.int_topo }}
                  onChange={(d) => setQ(d)}
                />
              )}
              {currentStep === 4 && (
                <Step5Consistance
                  data={{ consistance: q.consistance, textes_speciaux: q.textes_speciaux, caut_prov: q.caut_prov }}
                  onChange={(d) => setQ(d)}
                />
              )}
              {currentStep === 5 && (
                <Step6Delai
                  data={{ delai_type: q.delai_type, delai_ferme_mois: q.delai_ferme_mois, tranches: q.tranches, delais_partiels: q.delais_partiels, maintien_offre_duree: q.maintien_offre_duree }}
                  onChange={(d) => setQ(d)}
                />
              )}
              {currentStep === 6 && (
                <Step7Penalites
                  data={{ delai_garantie: q.delai_garantie, penalite_taux: q.penalite_taux, penalite_plafond: q.penalite_plafond, penalite_autres: q.penalite_autres, penalite_autres_detail: q.penalite_autres_detail }}
                  onChange={(d) => setQ(d)}
                />
              )}
              {currentStep === 7 && (
                <Step8Revision
                  data={{ revision_prix: q.revision_prix, rev_k: q.rev_k, rev_a: q.rev_a, rev_b: q.rev_b, rev_plafond: q.rev_plafond }}
                  onChange={(d) => setQ(d)}
                />
              )}
              {currentStep === 8 && (
                <Step9StApprovi
                  data={{ st_exclus: q.st_exclus, approvi: q.approvi }}
                  onChange={(d) => setQ(d)}
                />
              )}
              {currentStep === 9 && (
                <Step10Variante
                  data={{ variante: q.variante, variante_series: q.variante_series }}
                  onChange={(d) => setQ(d)}
                />
              )}
              {currentStep === 10 && (
                <Step11ClausesTech
                  data={{ tech_prescriptions: q.tech_prescriptions, tech_docs: q.tech_docs }}
                  onChange={(d) => setQ(d)}
                />
              )}
              {currentStep === 11 && (
                <Step12Prix
                  data={{ cdp_lignes: q.cdp_lignes }}
                  onChange={(d) => setQ(d)}
                />
              )}

              {/* Status messages */}
              {saveError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}
              {saveOk && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  Brouillon sauvegardé.
                </div>
              )}
            </CardBody>

            {/* Footer navigation */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <Button
                variant="ghost"
                size="md"
                onClick={goPrev}
                disabled={isFirstStep || creating || saving}
              >
                Précédent
              </Button>

              <div className="flex items-center gap-3">
                {saving && (
                  <span className="text-xs text-slate-400">Sauvegarde…</span>
                )}
                {state.projectId && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                    {state.dceRef}
                  </span>
                )}
                {!isLastStep ? (
                  <Button
                    variant="primary"
                    size="md"
                    loading={creating}
                    onClick={goNext}
                  >
                    {currentStep === 0 && !state.projectId && !editMode
                      ? 'Créer & continuer'
                      : currentStep === 0 && editMode
                        ? 'Modifier & continuer'
                        : 'Suivant'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    loading={saving}
                    onClick={handleFinish}
                  >
                    {editMode ? 'Enregistrer & voir le projet' : 'Terminer & voir le projet'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

// ─── Page export — wrapped in Suspense (required for useSearchParams) ─────────

export default function NouveauProjetPage() {
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
      <NouveauProjetInner />
    </Suspense>
  );
}
