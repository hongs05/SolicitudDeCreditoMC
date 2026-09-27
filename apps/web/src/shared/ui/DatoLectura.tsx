import type { ReactNode } from 'react';

export function DatoLectura({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{etiqueta}</dt>
      <dd className="text-base text-slate-900">{valor}</dd>
    </div>
  );
}
