import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface Aviso { id: number; tipo: 'exito' | 'error'; mensaje: string }
interface ContextoToast { exito(mensaje: string): void; error(mensaje: string): void }

const Contexto = createContext<ContextoToast | null>(null);
const DURACION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const mostrar = useCallback((tipo: Aviso['tipo'], mensaje: string) => {
    const id = Date.now() + Math.random();
    setAvisos((actuales) => [...actuales, { id, tipo, mensaje }]);
    setTimeout(() => setAvisos((actuales) => actuales.filter((a) => a.id !== id)), DURACION_MS);
  }, []);

  const valor = useMemo<ContextoToast>(
    () => ({ exito: (m) => mostrar('exito', m), error: (m) => mostrar('error', m) }),
    [mostrar],
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {avisos.map((a) => (
          <div
            key={a.id}
            role={a.tipo === 'error' ? 'alert' : 'status'}
            className={`rounded-md px-4 py-3 text-sm text-white shadow ${a.tipo === 'error' ? 'bg-red-700' : 'bg-teal-700'}`}
          >
            {a.mensaje}
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
