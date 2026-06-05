import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  className?: string;
  children: ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div className={clsx('flex items-center justify-between px-6 pt-5 pb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children }: CardProps) {
  return (
    <h3 className={clsx('text-sm font-semibold text-slate-700 uppercase tracking-wide', className)}>
      {children}
    </h3>
  );
}

export function CardBody({ className, children }: CardProps) {
  return <div className={clsx('px-6 pb-6', className)}>{children}</div>;
}
