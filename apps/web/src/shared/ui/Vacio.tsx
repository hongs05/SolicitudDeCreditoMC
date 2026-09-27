import type { ReactNode } from 'react';
import { Icono, type NombreIcono } from './Icono';

export function Vacio({ icono = 'buscar', titulo, children, acciones }: {
  icono?: NombreIcono; titulo: string; children?: ReactNode; acciones?: ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-2.5 px-5 py-12 text-center text-muted">
      <span className="grid size-11 -rotate-3 place-items-center rounded-[10px] bg-accent-soft text-accent">
        <Icono nombre={icono} className="size-5" />
      </span>
      <h2 className="text-lg font-bold text-ink">{titulo}</h2>
      {children && <div className="max-w-[46ch]">{children}</div>}
      {acciones}
    </div>
  );
}
