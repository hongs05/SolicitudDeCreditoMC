import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro';

const ESTILOS: Record<Variante, string> = {
  primario: 'bg-teal-700 text-white hover:bg-teal-800',
  secundario: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
  peligro: 'bg-red-700 text-white hover:bg-red-800',
};

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, BotonProps>(function Button(
  { variante = 'primario', cargando = false, disabled, className = '', type = 'button', ...resto },
  ref,
) {
  return (
    <button
      {...resto}
      ref={ref}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${ESTILOS[variante]} ${className}`}
    />
  );
});
