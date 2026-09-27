import type { ReactNode } from 'react';

export function Card({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {titulo && <h2 className="mb-4 text-lg font-semibold text-slate-900">{titulo}</h2>}
      {children}
    </section>
  );
}
