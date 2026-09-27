import type { ReactNode } from 'react';
import { Icono, type NombreIcono } from './Icono';

/** Página de error con código grande (403, 404, !) según el diseño. */
export function PaginaError({ codigo, icono, tono = 'neutro', titulo, texto, acciones, detalle }: {
  codigo: string; icono: NombreIcono; tono?: 'neutro' | 'aviso' | 'grave';
  titulo: string; texto: string; acciones?: ReactNode; detalle?: ReactNode;
}) {
  const color = tono === 'grave' ? 'text-danger' : tono === 'aviso' ? 'text-pend' : 'text-accent';
  return (
    <section className="rounded-[14px] border border-line bg-surface">
      <div className="grid justify-items-center gap-3 px-5 py-14 text-center">
        <div aria-hidden="true" className={`relative text-6xl font-extrabold tracking-[-0.03em] tabular-nums ${color}`}>
          {codigo}
          <span className="absolute -right-5 -bottom-1 grid size-8 place-items-center rounded-lg border border-line bg-surface">
            <Icono nombre={icono} />
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">{titulo}</h1>
        <p className="max-w-[52ch] text-muted">{texto}</p>
        {detalle}
        {acciones && <div className="mt-2 flex flex-wrap justify-center gap-2.5">{acciones}</div>}
      </div>
    </section>
  );
}
