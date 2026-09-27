export interface NuevoDesembolso {
  creditoId: number;
  bancoId: number;
  numeroCuenta: string;
  ejecutadoPorId: number;
  ejecutadoEn: Date;
}

export interface DesembolsoRepository {
  crear(datos: NuevoDesembolso): Promise<{ id: number }>;
}
