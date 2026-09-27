import type { ReactNode } from 'react';

/** Una fila etiqueta / valor dentro de un `<dl>`. */
/** `mono` es para identificadores (cédula, número de crédito o de cuenta); las cifras ya usan números tabulares. */
export function DatoLectura({ etiqueta, valor, mono = false }: { etiqueta: string; valor: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[13px] text-muted">{etiqueta}</dt>
      <dd className={`min-w-0 text-right font-medium [overflow-wrap:anywhere] ${mono ? 'font-mono text-[13px]' : ''}`}>{valor}</dd>
    </div>
  );
}

/** Bloque con título y una lista de datos, como los grupos Cliente / Crédito del diseño. */
export function GrupoDatos({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-3 p-5">
      <h2 className="text-sm font-bold tracking-[-0.01em] text-ink">{titulo}</h2>
      <dl className="grid gap-2.5">{children}</dl>
    </div>
  );
}
