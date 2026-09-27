import {
  cloneElement, forwardRef, type InputHTMLAttributes, type ReactElement,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react';

const BASE = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm aria-[invalid=true]:border-red-600 focus:outline-none focus:ring-2 focus:ring-teal-600';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...resto }, ref) => <input ref={ref} {...resto} className={`${BASE} ${className}`} />,
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', ...resto }, ref) => <select ref={ref} {...resto} className={`${BASE} ${className}`} />,
);
Select.displayName = 'Select';

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...resto }, ref) => <textarea ref={ref} {...resto} className={`${BASE} ${className}`} />,
);
TextArea.displayName = 'TextArea';

export interface FieldProps {
  id: string;
  etiqueta: string;
  error?: string;
  children: ReactElement<Record<string, unknown>>;
}

export function Field({ id, etiqueta, error, children }: FieldProps) {
  const idError = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{etiqueta}</label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? idError : undefined,
      })}
      {error && <p id={idError} className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
