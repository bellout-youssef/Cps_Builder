'use client';

import { clsx } from 'clsx';
import { Check } from 'lucide-react';

interface Step {
  label: string;
}

interface WizardProgressProps {
  steps: Step[];
  currentStep: number;
}

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  return (
    <nav aria-label="Étapes du wizard">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const status =
            index < currentStep ? 'done' : index === currentStep ? 'current' : 'upcoming';
          const isLast = index === steps.length - 1;

          return (
            <li key={step.label} className={clsx('flex items-center', !isLast && 'flex-1')}>
              {/* Circle */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={clsx(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                    status === 'done' &&
                      'border-indigo-600 bg-indigo-600 text-white',
                    status === 'current' &&
                      'border-indigo-600 bg-white text-indigo-600',
                    status === 'upcoming' &&
                      'border-slate-300 bg-white text-slate-400',
                  )}
                >
                  {status === 'done' ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={clsx(
                    'text-xs font-medium whitespace-nowrap',
                    status === 'current' ? 'text-indigo-700' : 'text-slate-500',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {!isLast && (
                <div
                  className={clsx(
                    'mx-3 mb-5 h-0.5 flex-1 transition-colors',
                    index < currentStep ? 'bg-indigo-600' : 'bg-slate-200',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
