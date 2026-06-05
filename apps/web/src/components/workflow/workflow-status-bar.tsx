'use client';

import { Check } from 'lucide-react';
import { WorkflowStep } from '@cps/shared';
import { clsx } from 'clsx';

const PIPELINE: Array<{ step: WorkflowStep; label: string; short: string }> = [
  { step: WorkflowStep.CREATION, label: 'Création', short: '1' },
  { step: WorkflowStep.VERIFICATION, label: 'Vérification', short: '2' },
  { step: WorkflowStep.BUSINESS_VALIDATION, label: 'Validation métier', short: '3' },
  { step: WorkflowStep.REF_VALIDATION, label: 'Validation référentiel', short: '4' },
  { step: WorkflowStep.PUBLISHED, label: 'Publié', short: '5' },
];

const STEP_ORDER: Partial<Record<WorkflowStep, number>> = {
  [WorkflowStep.CREATION]: 0,
  [WorkflowStep.VERIFICATION]: 1,
  [WorkflowStep.BUSINESS_VALIDATION]: 2,
  [WorkflowStep.REF_VALIDATION]: 3,
  [WorkflowStep.PUBLISHED]: 4,
  [WorkflowStep.ARCHIVED]: 5,
};

interface WorkflowStatusBarProps {
  currentStep: WorkflowStep;
}

export function WorkflowStatusBar({ currentStep }: WorkflowStatusBarProps) {
  const currentOrder = STEP_ORDER[currentStep] ?? 0;
  const isArchived = currentStep === WorkflowStep.ARCHIVED;

  if (isArchived) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-4">
        <p className="text-sm font-medium text-slate-500">Ce CPS est archivé.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-5">
      <ol className="flex items-center">
        {PIPELINE.map(({ step, label }, index) => {
          const order = STEP_ORDER[step] ?? 0;
          const isDone = order < currentOrder;
          const isCurrent = step === currentStep;
          const isLast = index === PIPELINE.length - 1;

          return (
            <li key={step} className={clsx('flex items-center', !isLast && 'flex-1 min-w-0')}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    isDone && 'border-indigo-600 bg-indigo-600 text-white',
                    isCurrent && 'border-indigo-600 bg-white text-indigo-600 shadow-sm',
                    !isDone && !isCurrent && 'border-slate-200 bg-white text-slate-400',
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={clsx(
                    'hidden text-xs font-medium sm:block whitespace-nowrap',
                    isCurrent && 'text-indigo-700',
                    isDone && 'text-slate-500',
                    !isDone && !isCurrent && 'text-slate-400',
                  )}
                >
                  {label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={clsx(
                    'mx-3 mb-5 h-0.5 flex-1 transition-colors',
                    isDone ? 'bg-indigo-600' : 'bg-slate-200',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
