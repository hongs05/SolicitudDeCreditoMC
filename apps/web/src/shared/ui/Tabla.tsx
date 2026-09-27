import type { ReactNode } from 'react';
import { useT } from '../i18n/I18nProvider';

export interface Columna<T> {
  clave: string;
  titulo: string;
  celda(fila: T): ReactNode;
  derecha?: boolean;
}

export function Tabla<T>({ columnas, filas, claveFila }: { columnas: Columna<T>[]; filas: T[]; claveFila(fila: T): string | number }) {
  const { t } = useT();
  if (filas.length === 0) return <p className="py-6 text-center text-sm text-slate-500">{t('comun.sinResultados')}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} scope="col" className={`px-3 py-2 font-medium text-slate-600 ${c.derecha ? 'text-right' : 'text-left'}`}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filas.map((fila) => (
            <tr key={claveFila(fila)}>
              {columnas.map((c) => (
                <td key={c.clave} className={`px-3 py-2 ${c.derecha ? 'text-right tabular-nums' : ''}`}>{c.celda(fila)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
