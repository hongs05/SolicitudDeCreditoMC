import { describe, expect, it } from 'vitest';
import { esRol, Rol, tieneRol } from './rol';

describe('tieneRol', () => {
  it('permite los roles listados', () => {
    expect(tieneRol(Rol.ANALISTA, [Rol.ANALISTA])).toBe(true);
    expect(tieneRol(Rol.CAJERO, [Rol.ANALISTA])).toBe(false);
  });

  it('ADMIN pasa cualquier restricción', () => {
    expect(tieneRol(Rol.ADMIN, [Rol.CAJERO])).toBe(true);
    expect(tieneRol(Rol.ADMIN, [])).toBe(true);
  });

  it('reconoce roles válidos', () => {
    expect(esRol('OFICIAL')).toBe(true);
    expect(esRol('GERENTE')).toBe(false);
  });
});
