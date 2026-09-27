import type { Locale } from '@credito/domain';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { preferencias } from '../api/preferencias';
import { en } from './en';
import { type ClaveTexto, es } from './es';

const DICCIONARIOS: Record<Locale, Record<ClaveTexto, string>> = { es, en };

export type Traductor = (clave: ClaveTexto, params?: Record<string, string | number>) => string;

export function interpolar(plantilla: string, params: Record<string, string | number> = {}): string {
  return plantilla.replace(/\{(\w+)\}/g, (original, nombre: string) =>
    nombre in params ? String(params[nombre]) : original,
  );
}

interface ContextoI18n {
  t: Traductor;
  locale: Locale;
  cambiarLocale(locale: Locale): void;
}

const Contexto = createContext<ContextoI18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(preferencias.locale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const cambiarLocale = useCallback((nuevo: Locale) => {
    preferencias.fijarLocale(nuevo);
    setLocale(nuevo);
  }, []);

  const valor = useMemo<ContextoI18n>(
    () => ({
      locale,
      cambiarLocale,
      t: (clave, params) => interpolar(DICCIONARIOS[locale][clave], params),
    }),
    [locale, cambiarLocale],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useT(): ContextoI18n {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useT debe usarse dentro de I18nProvider');
  return contexto;
}
