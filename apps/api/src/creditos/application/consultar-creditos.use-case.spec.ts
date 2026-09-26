import { EstadoSolicitud, NoEncontradoError, Periodicidad } from '@credito/domain';
import { describe, expect, it } from 'vitest';
import { ConsultarCreditos } from './consultar-creditos.use-case';
import type { CreditoConsultas, CreditoVista } from './ports/credito.consultas';

const vista: CreditoVista = {
  id: 1, numero: 'CR-000001', solicitudId: 1, cedula: 'X', nombreCompleto: 'Ana', monto: 10000,
  tasaAnual: 12, periodicidad: Periodicidad.MENSUAL, plazo: 12, cuotaNivelada: 888.49,
  fechaBase: '2026-09-24', estado: EstadoSolicitud.APROBADA, creadoEn: new Date(), desembolso: null,
};

const consultas = (existe: boolean): CreditoConsultas => ({
  listar: async (f) => ({ items: [vista], total: 1, page: f.page, pageSize: f.pageSize }),
  obtener: async () => (existe ? vista : null),
  cuotas: async () => [],
});

describe('ConsultarCreditos', () => {
  it('obtener lanza NO_ENCONTRADO si no existe', async () => {
    await expect(new ConsultarCreditos(consultas(false)).obtener(1)).rejects.toBeInstanceOf(NoEncontradoError);
  });

  it('planPagos combina crédito y cuotas', async () => {
    expect(await new ConsultarCreditos(consultas(true)).planPagos(1)).toEqual({ credito: vista, cuotas: [] });
  });

  it('planPagos de un crédito inexistente lanza NO_ENCONTRADO', async () => {
    await expect(new ConsultarCreditos(consultas(false)).planPagos(1)).rejects.toBeInstanceOf(NoEncontradoError);
  });
});
