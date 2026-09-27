export function aQuery(parametros: Record<string, string | number | undefined>): string {
  const pares = Object.entries(parametros)
    .filter(([, valor]) => valor !== undefined && valor !== '')
    .map(([clave, valor]) => [clave, String(valor)]);
  return new URLSearchParams(pares).toString();
}
