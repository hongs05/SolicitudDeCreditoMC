import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Icono } from './Icono';

export interface AccionToast { etiqueta: string; ejecutar(): void }
interface Aviso { id: number; tipo: 'exito' | 'error' | 'info'; mensaje: string; detalle?: string; accion?: AccionToast }
interface Opciones { detalle?: string; accion?: AccionToast }
interface ContextoToast {
  exito(mensaje: string, opciones?: Opciones): void;
  error(mensaje: string, opciones?: Opciones): void;
  info(mensaje: string, opciones?: Opciones): void;
}

const Contexto = createContext<ContextoToast | null>(null);
const DURACION_MS = 5000;
const ICONO = { exito: 'check', error: 'alerta', info: 'info' } as const;
const COLOR = { exito: 'bg-desem', error: 'bg-danger', info: 'bg-accent' } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const quitar = useCallback((id: number) => setAvisos((actuales) => actuales.filter((a) => a.id !== id)), []);

  const mostrar = useCallback((tipo: Aviso['tipo'], mensaje: string, opciones: Opciones = {}) => {
    const id = Date.now() + Math.random();
    setAvisos((actuales) => [...actuales.slice(-2), { id, tipo, mensaje, ...opciones }]);
    // Con una acción (Reintentar) el aviso dura el doble para dar tiempo a usarla.
    setTimeout(() => quitar(id), opciones.accion ? DURACION_MS * 2 : DURACION_MS);
  }, [quitar]);

  const valor = useMemo<ContextoToast>(
    () => ({
      exito: (m, o) => mostrar('exito', m, o),
      error: (m, o) => mostrar('error', m, o),
      info: (m, o) => mostrar('info', m, o),
    }),
    [mostrar],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="fixed right-4 bottom-[calc(16px+env(safe-area-inset-bottom,0px))] z-80 flex w-[min(360px,calc(100%-32px))] flex-col gap-2">
        {avisos.map((a) => (
          <div
            key={a.id}
            role={a.tipo === 'error' ? 'alert' : 'status'}
            className="anim-toast flex items-start gap-2.5 rounded-[14px] bg-surface px-3.5 py-3 text-ink shadow-float"
          >
            <span aria-hidden="true" className={`mt-0.5 grid size-4.5 shrink-0 place-items-center rounded text-surface ${COLOR[a.tipo]}`}>
              <Icono nombre={ICONO[a.tipo]} className="size-3" />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block font-semibold">{a.mensaje}</strong>
              {a.detalle && <small className="text-[12.5px] text-muted">{a.detalle}</small>}
            </div>
            {a.accion && (
              <button type="button" className="shrink-0 rounded-full px-2 py-0.5 text-[13px] font-semibold text-accent hover:bg-surface-2"
                onClick={() => { quitar(a.id); a.accion!.ejecutar(); }}>
                {a.accion.etiqueta}
              </button>
            )}
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}

export function useToast(): ContextoToast {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useToast debe usarse dentro de ToastProvider');
  return contexto;
}
