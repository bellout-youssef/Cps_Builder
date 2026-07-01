'use client';

import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  group?: string;
}

interface WizardProgressProps {
  steps: Step[];
  currentStep: number;
  /** Appelé quand l'utilisateur clique sur un dot cliquable. */
  onStepClick?: (index: number) => void;
  /** Indices des étapes cliquables (défaut : aucune si onStepClick absent). */
  clickableUpTo?: number;
}

export function WizardProgress({ steps, currentStep, onStepClick, clickableUpTo }: WizardProgressProps) {
  const pct = Math.round((currentStep / (steps.length - 1)) * 100);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status =
            index < currentStep ? 'done' : index === currentStep ? 'current' : 'upcoming';
          const isLast = index === steps.length - 1;
          const isClickable =
            onStepClick !== undefined &&
            index !== currentStep &&
            (clickableUpTo === undefined || index <= clickableUpTo);

          return (
            <div key={index} className={clsx('flex items-center', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center gap-1" title={step.label}>
                <div
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={isClickable ? () => onStepClick(index) : undefined}
                  onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onStepClick(index); } : undefined}
                  className={clsx(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    status === 'done' && 'border-indigo-600 bg-indigo-600 text-white',
                    status === 'current' && 'border-indigo-600 bg-white text-indigo-600 ring-2 ring-indigo-100',
                    status === 'upcoming' && 'border-slate-200 bg-white text-slate-400',
                    isClickable && 'cursor-pointer hover:ring-2 hover:ring-indigo-200',
                  )}
                >
                  {status === 'done' ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </div>
              </div>
              {!isLast && (
                <div
                  className={clsx(
                    'mx-0.5 mb-0 h-0.5 flex-1',
                    index < currentStep ? 'bg-indigo-600' : 'bg-slate-200',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step label */}
      <div className="text-center">
        <span className="text-xs font-medium text-indigo-700">
          Étape {currentStep + 1} / {steps.length} — {steps[currentStep]?.label}
        </span>
      </div>
    </div>
  );
}
