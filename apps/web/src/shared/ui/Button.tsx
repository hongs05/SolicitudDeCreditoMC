import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro' | 'discreto';
type Tamano = 'sm' | 'md' | 'lg';

const ESTILOS: Record<Variante, string> = {
  primario: 'bg-accent text-on-accent hover:bg-accent-strong',
  secundario: 'border border-line-strong bg-surface text-ink hover:bg-surface-2',
  peligro: 'bg-danger text-on-danger hover:opacity-90',
  discreto: 'bg-transparent text-muted hover:bg-surface-2 hover:text-ink',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-[15px]',
};

// Clases compartidas con los enlaces que se ven como botón.
export const claseBoton = (variante: Variante = 'primario', tamano: Tamano = 'md') =>
  `relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold leading-tight transition-[transform,background-color,opacity] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-45 aria-disabled:active:scale-100 ${ESTILOS[variante]} ${TAMANOS[tamano]}`;

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, BotonProps>(function Button(
  { variante = 'primario', tamano = 'md', cargando = false, disabled, className = '', type = 'button', children, ...resto },
  ref,
) {
  return (
    <button
      {...resto}
      ref={ref}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={`${claseBoton(variante, tamano)} ${className}`}
    >
      <span className={`inline-flex items-center gap-2 transition-opacity ${cargando ? 'opacity-0' : ''}`}>{children}</span>
      {cargando && <span aria-hidden="true" className="anim-giro absolute size-4 rounded-full border-2 border-current border-r-transparent" />}
    </button>
  );
});
