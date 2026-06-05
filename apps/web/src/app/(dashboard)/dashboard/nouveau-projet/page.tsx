'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import type { ProjectType } from '@cps/shared';
import { useAuth } from '@/contexts/auth-context';
import { createProject } from '@/lib/api/projects';
import { Header } from '@/components/layout/header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WizardProgress } from '@/components/nouveau-projet/wizard-progress';
import { StepTypes, type StepTypesData } from '@/components/nouveau-projet/step-types';
import { StepArticles } from '@/components/nouveau-projet/step-articles';
import { StepClauses } from '@/components/nouveau-projet/step-clauses';
import { StepQuestionnaire } from '@/components/nouveau-projet/step-questionnaire';

// ─── Wizard state ─────────────────────────────────────────────────────────────

interface WizardState {
  step1: StepTypesData;
  step2ArticleIds: string[];
  step3ClauseIds: string[];
  step4Answers: Record<string, string>;
}

const INITIAL_STATE: WizardState = {
  step1: { name: '', description: '', types: [], isPrivate: true },
  step2ArticleIds: [],
  step3ClauseIds: [],
  step4Answers: {},
};

const STEPS = [
  { label: 'Informations' },
  { label: 'Articles' },
  { label: 'Clauses' },
  { label: 'Questionnaire' },
];

// ─── Validation ───────────────────────────────────────────────────────────────

type Step1Errors = Partial<Record<keyof StepTypesData, string>>;

function validateStep1(data: StepTypesData): Step1Errors {
  const errors: Step1Errors = {};
  if (!data.name.trim()) errors.name = 'Le nom du projet est obligatoire.';
  if (data.types.length === 0) errors.types = 'Sélectionnez au moins un type de projet.';
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NouveauProjetPage() {
  const { can, user } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!user || !can('projects:create')) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="Nouveau projet" />
        <main className="flex flex-1 items-center justify-center p-6">
          <p className="text-sm text-slate-500">
            Vous n&apos;avez pas l&apos;autorisation de créer un projet.
          </p>
        </main>
      </div>
    );
  }

  function goNext() {
    if (currentStep === 0) {
      const errors = validateStep1(state.step1);
      if (Object.keys(errors).length > 0) {
        setStep1Errors(errors);
        return;
      }
      setStep1Errors({});
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goPrev() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const project = await createProject({
        name: state.step1.name.trim(),
        description: state.step1.description.trim() || undefined,
        types: state.step1.types as ProjectType[],
        isPrivate: state.step1.isPrivate,
        articleIds: state.step2ArticleIds,
        clauseIds: state.step3ClauseIds,
        questionnaireAnswers: state.step4Answers,
      });
      router.push(`/dashboard/projects/${project.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur lors de la création du projet.');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Nouveau projet" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Progress */}
          <WizardProgress steps={STEPS} currentStep={currentStep} />

          {/* Step card */}
          <Card>
            <CardBody className="pt-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  {currentStep === 0 && 'Informations générales'}
                  {currentStep === 1 && 'Sélection des articles'}
                  {currentStep === 2 && 'Clauses techniques'}
                  {currentStep === 3 && 'Questionnaire — Chapitre II'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {currentStep === 0 && 'Donnez un nom à votre CPS et choisissez les types de travaux.'}
                  {currentStep === 1 && 'Sélectionnez les articles du référentiel à inclure dans ce CPS.'}
                  {currentStep === 2 && 'Vérifiez et complétez les clauses techniques proposées.'}
                  {currentStep === 3 && 'Renseignez les paramètres qui vont construire le Chapitre II.'}
                </p>
              </div>

              {currentStep === 0 && (
                <StepTypes
                  data={state.step1}
                  onChange={(step1) => setState((s) => ({ ...s, step1 }))}
                  errors={step1Errors}
                />
              )}
              {currentStep === 1 && (
                <StepArticles
                  selectedIds={state.step2ArticleIds}
                  onChange={(step2ArticleIds) => setState((s) => ({ ...s, step2ArticleIds }))}
                />
              )}
              {currentStep === 2 && (
                <StepClauses
                  selectedArticleIds={state.step2ArticleIds}
                  projectTypes={state.step1.types as ProjectType[]}
                  selectedClauseIds={state.step3ClauseIds}
                  onChange={(step3ClauseIds) => setState((s) => ({ ...s, step3ClauseIds }))}
                />
              )}
              {currentStep === 3 && (
                <StepQuestionnaire
                  answers={state.step4Answers}
                  onChange={(step4Answers) => setState((s) => ({ ...s, step4Answers }))}
                />
              )}

              {/* Submit error */}
              {submitError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}
            </CardBody>

            {/* Navigation footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <Button
                variant="ghost"
                size="md"
                onClick={goPrev}
                disabled={currentStep === 0 || submitting}
              >
                Précédent
              </Button>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Étape {currentStep + 1} / {STEPS.length}
                </span>
                {currentStep < STEPS.length - 1 ? (
                  <Button variant="primary" size="md" onClick={goNext}>
                    Suivant
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    loading={submitting}
                    onClick={handleSubmit}
                  >
                    Créer le projet
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
