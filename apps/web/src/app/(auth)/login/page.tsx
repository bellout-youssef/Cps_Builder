'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* Redirect already-authenticated users */
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);
      try {
        await login(email, password);
        router.push('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de connexion');
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, login, router],
  );

  if (isLoading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">CPS Builder</h1>
          <p className="mt-1.5 text-sm text-slate-500">Plateforme SaaS de Génération de CPS</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-8 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-slate-900">Connexion</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <Input
              id="email"
              type="email"
              label="Adresse e-mail"
              placeholder="vous@example.com"
              autoComplete="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="password"
              type="password"
              label="Mot de passe"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <Button type="submit" loading={submitting} className="w-full" size="md">
              Se connecter
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} CPS Builder — Accès réservé aux utilisateurs autorisés
        </p>
      </div>
    </div>
  );
}
