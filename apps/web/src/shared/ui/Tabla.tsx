import type { KeyboardEvent, ReactNode } from 'react';
import { useT } from '../i18n/I18nProvider';
import { Vacio } from './Vacio';

export interface Columna<T> {
  clave: string;
  titulo: string;
  celda(fila: T): ReactNode;
  derecha?: boolean;
  /** Identificadores (número de crédito, cédula) en monoespaciada. Las cifras usan números tabulares. */
  mono?: boolean;
  /** Se oculta en pantallas angostas para que la tabla quepa. */
  secundaria?: boolean;
}

export interface TablaProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  claveFila(fila: T): string | number;
  /** Al hacer clic o pulsar Enter en una fila. Los enlaces dentro de la fila siguen funcionando. */
  onFila?(fila: T): void;
  vacio?: ReactNode;
  claseFila?(fila: T): string;
  pie?: ReactNode;
}

export function Tabla<T>({ columnas, filas, claveFila, onFila, vacio, claseFila, pie }: TablaProps<T>) {
  const { t } = useT();
  if (filas.length === 0) return <>{vacio ?? <Vacio titulo={t('comun.sinResultados')} />}</>;
  const teclado = (fila: T) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' && e.target === e.currentTarget) onFila?.(fila);
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.clave} scope="col"
                className={`border-b border-line bg-surface-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap text-muted ${c.derecha ? 'text-right' : 'text-left'} ${c.secundaria ? 'max-sm:hidden' : ''}`}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={claveFila(fila)}
              onClick={onFila ? (e) => { if (!(e.target as HTMLElement).closest('a,button')) onFila(fila); } : undefined}
              onKeyDown={onFila ? teclado(fila) : undefined}
              tabIndex={onFila ? 0 : undefined}
              className={`border-b border-line last:border-b-0 ${onFila ? 'cursor-pointer transition-colors hover:bg-surface-2 focus-visible:outline-offset-[-2px]' : ''} ${claseFila?.(fila) ?? ''}`}>
              {columnas.map((c) => (
                <td key={c.clave}
                  className={`px-3.5 py-3 align-middle ${c.derecha ? 'text-right whitespace-nowrap' : ''} ${c.mono ? 'font-mono text-[13px]' : ''} ${c.secundaria ? 'max-sm:hidden' : ''}`}>
                  {c.celda(fila)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {pie}
      </table>
    </div>
  );
}
