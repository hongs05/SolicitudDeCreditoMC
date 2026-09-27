import {
  cloneElement, forwardRef, type InputHTMLAttributes, type ReactElement, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react';

/** Clases comunes de los controles de formulario. */
export const CLASE_CONTROL = 'w-full min-w-0 max-sm:min-h-11 rounded-[10px] border border-input bg-surface px-2.5 py-2 text-sm text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/30 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger-soft';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...resto }, ref) => <input ref={ref} {...resto} className={`${CLASE_CONTROL} ${className}`} />,
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', ...resto }, ref) => <select ref={ref} {...resto} className={`${CLASE_CONTROL} control-select pr-[34px] ${className}`} />,
);
Select.displayName = 'Select';

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...resto }, ref) => <textarea ref={ref} {...resto} className={`${CLASE_CONTROL} min-h-22 resize-y ${className}`} />,
);
TextArea.displayName = 'TextArea';

export interface FieldProps {
  id: string;
  etiqueta: string;
  error?: string;
  /** Texto fijo dentro del control, como `C$` o `%`. Es decorativo: la etiqueta ya describe el campo. */
  prefijo?: string;
  sufijo?: string;
  /** Control dentro del campo, a la derecha (por ejemplo, Mostrar contraseña). */
  adorno?: ReactNode;
  ayuda?: ReactNode;
  className?: string;
  children: ReactElement<Record<string, unknown>>;
}

export function Field({ id, etiqueta, error, prefijo, sufijo, adorno, ayuda, className = '', children }: FieldProps) {
  const idError = `${id}-error`;
  const control = cloneElement(children, {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? idError : undefined,
    className: `${(children.props.className as string | undefined) ?? ''} ${prefijo ? 'pl-8' : ''} ${sufijo ? 'pr-8' : ''}`.trim(),
  });
  const afijo = 'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[13px] font-medium text-muted';
  return (
    <div className={`grid min-w-0 content-start gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[12.5px] font-semibold text-muted">{etiqueta}</label>
      {prefijo || sufijo || adorno ? (
        <div className="relative">
          {prefijo && <span aria-hidden="true" className={`${afijo} left-2.5`}>{prefijo}</span>}
          {control}
          {sufijo && <span aria-hidden="true" className={`${afijo} right-2.5`}>{sufijo}</span>}
          {adorno && <div className="absolute inset-y-1 right-1 flex">{adorno}</div>}
        </div>
      ) : control}
      {error ? <p id={idError} className="text-xs text-danger">{error}</p> : ayuda}
    </div>
  );
}
