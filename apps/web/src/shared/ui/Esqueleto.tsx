import { useT } from '../i18n/I18nProvider';

/** Anuncia la carga a lectores de pantalla; los bloques visibles son decorativos. */
function Anuncio() {
  const { t } = useT();
  return <span className="sr-only">{t('comun.cargando')}</span>;
}

const ANCHOS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/12', 'w-7/12'];

/** Filas con la forma de una tabla mientras llega el listado. */
export function EsqueletoTabla({ filas = 5, columnas = 5 }: { filas?: number; columnas?: number }) {
  return (
    <div role="status" aria-busy="true">
      <Anuncio />
      <div aria-hidden="true">
        <div className="flex gap-6 border-b border-line bg-surface-2 px-3.5 py-3">
          {Array.from({ length: columnas }, (_, c) => <span key={c} className="esqueleto h-3 flex-1" />)}
        </div>
        {Array.from({ length: filas }, (_, f) => (
          <div key={f} className="flex items-center gap-6 border-b border-line px-3.5 py-4 last:border-b-0">
            {Array.from({ length: columnas }, (_, c) => (
              <span key={c} className="flex-1"><span className={`esqueleto block h-3.5 ${ANCHOS[(f + c) % ANCHOS.length]}`} /></span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tarjetas de datos de una pantalla de detalle (expediente, dictamen, desembolso). */
export function EsqueletoDetalle() {
  const grupo = (filas: number) => (
    <div className="grid gap-3.5 p-5">
      <span className="esqueleto h-4 w-28" />
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex justify-between gap-6">
          <span className="esqueleto h-3.5 w-24" />
          <span className={`esqueleto h-3.5 ${ANCHOS[i % ANCHOS.length]} max-w-40`} />
        </div>
      ))}
    </div>
  );
  return (
    <div role="status" aria-busy="true" className="grid gap-6">
      <Anuncio />
      <div aria-hidden="true" className="grid gap-2.5">
        <span className="esqueleto h-3 w-32" />
        <span className="esqueleto h-8 w-80 max-w-full" />
      </div>
      <div aria-hidden="true" className="grid max-w-215 rounded-[14px] border border-line bg-surface md:grid-cols-2 md:divide-x md:divide-line">
        {grupo(3)}
        {grupo(4)}
      </div>
    </div>
  );
}
