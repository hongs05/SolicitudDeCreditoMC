export enum Rol {
  OFICIAL = 'OFICIAL',
  ANALISTA = 'ANALISTA',
  CAJERO = 'CAJERO',
  ADMIN = 'ADMIN',
}

export function esRol(valor: string): valor is Rol {
  return (Object.values(Rol) as string[]).includes(valor);
}

export function tieneRol(rol: Rol, permitidos: readonly Rol[]): boolean {
  return rol === Rol.ADMIN || permitidos.includes(rol);
}
