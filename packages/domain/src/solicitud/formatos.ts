/** Nombre de persona: letras (con tildes y ñ), espacios, puntos, apóstrofos y guiones. Sin dígitos. */
export const PATRON_NOMBRE = /^\p{L}[\p{L}\s.'-]*$/u;

/** Teléfono: dígitos con espacios, guiones o paréntesis opcionales, y un + inicial. Al menos 7 dígitos. */
export const PATRON_TELEFONO = /^\+?(?:[\s()-]*\d){7,15}[\s()-]*$/;
