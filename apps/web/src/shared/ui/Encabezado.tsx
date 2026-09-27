import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface Miga { texto: string; a?: string }

/** Cabecera de página: migas, título, subtítulo y acciones a la derecha. */
export function Encabezado({ migas = [], titulo, subtitulo, acciones }: {
  migas?: Miga[]; titulo: ReactNode; subtitulo?: ReactNode; acciones?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-line pb-4.5">
      <div className="grid min-w-0 gap-1.5">
        {migas.length > 0 && (
          <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-[12.5px] font-medium text-muted">
            {migas.map((m, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {m.a ? <Link to={m.a} className="text-accent hover:underline">{m.texto}</Link> : <span>{m.texto}</span>}
                {i < migas.length - 1 && <span aria-hidden="true">/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="flex flex-wrap items-center gap-3 text-[clamp(24px,2.6vw,32px)] leading-tight font-extrabold tracking-[-0.035em]">{titulo}</h1>
        {subtitulo && <p className="max-w-[64ch] text-muted">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">{acciones}</div>}
    </div>
  );
}
