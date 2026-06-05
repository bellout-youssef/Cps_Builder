import type { ReactNode } from 'react';

export const metadata = {
  title: 'CPS Builder',
  description: 'Plateforme SaaS de Génération de CPS',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
