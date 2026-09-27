import { describe, expect, it } from 'vitest';
import { CedulaFechaDistintaError, SolicitudAbiertaExistenteError } from '../errors/errores';
import { EstadoSolicitud } from './estado-solicitud';
import { verificarHistorialCedula } from './historial-cedula';

const previa = (id: number, estado: EstadoSolicitud, fechaNacimiento = '1990-01-01') => ({ id, estado, fechaNacimiento });

describe('verificarHistorialCedula', () => {
  it('acepta una cédula nueva', () => {
    expect(() => verificarHistorialCedula('1990-01-01', [])).not.toThrow();
  });

  it('acepta si las solicitudes anteriores ya se cerraron', () => {
    expect(() => verificarHistorialCedula('1990-01-01', [
      previa(1, EstadoSolicitud.RECHAZADA), previa(2, EstadoSolicitud.DESEMBOLSADA),
    ])).not.toThrow();
  });

  it.each([EstadoSolicitud.PENDIENTE, EstadoSolicitud.APROBADA])('rechaza si hay una solicitud %s', (estado) => {
    const accion = () => verificarHistorialCedula('1990-01-01', [previa(3, EstadoSolicitud.RECHAZADA), previa(7, estado)]);
    expect(accion).toThrow(SolicitudAbiertaExistenteError);
    try {
      accion();
    } catch (error) {
      expect((error as SolicitudAbiertaExistenteError).params).toEqual({ id: 7, estado });
    }
  });

  it('rechaza la misma cédula con otra fecha de nacimiento', () => {
    expect(() => verificarHistorialCedula('1991-05-05', [previa(1, EstadoSolicitud.DESEMBOLSADA)]))
      .toThrow(CedulaFechaDistintaError);
  });

  it('la solicitud abierta tiene prioridad sobre la fecha distinta', () => {
    expect(() => verificarHistorialCedula('1991-05-05', [previa(4, EstadoSolicitud.PENDIENTE)]))
      .toThrow(SolicitudAbiertaExistenteError);
  });
});
