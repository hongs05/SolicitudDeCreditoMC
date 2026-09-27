import { Credito, type CreditoProps, type CuotaPlan, Solicitud, type SolicitudPrevia, type SolicitudProps } from '@credito/domain';
import type { RefreshTokenRepository } from '../auth/application/ports/refresh-token.repository';
import type { UsuarioRepository } from '../auth/application/ports/usuario.repository';
import { RefreshToken, type RefreshTokenProps } from '../auth/domain/refresh-token';
import type { Usuario } from '../auth/domain/usuario';
import type { CreditoRepository } from '../creditos/application/ports/credito.repository';
import type { DesembolsoRepository, NuevoDesembolso } from '../desembolsos/application/ports/desembolso.repository';
import type { CatalogoRepository } from '../shared/application/ports/catalogo.repository';
import type { Clock } from '../shared/application/ports/clock';
import type { RepositoriosTx, UnitOfWork } from '../shared/application/ports/unit-of-work';
import type { ItemCatalogo } from '../shared/application/vistas';
import type { SolicitudRepository } from '../solicitudes/application/ports/solicitud.repository';

export class RelojFijo implements Clock {
  constructor(
    private instante = new Date('2026-09-24T15:00:00Z'),
    private fecha = '2026-09-24',
  ) {}

  ahora(): Date {
    return new Date(this.instante);
  }

  hoy(): string {
    return this.fecha;
  }

  fijar(instante: Date, fecha: string): void {
    this.instante = instante;
    this.fecha = fecha;
  }
}

export class UsuariosEnMemoria implements UsuarioRepository {
  readonly usuarios: Usuario[] = [];

  agregar(usuario: Usuario): Usuario {
    this.usuarios.push(usuario);
    return usuario;
  }

  async buscarPorUsername(username: string): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.username === username) ?? null;
  }

  async obtenerPorId(id: number): Promise<Usuario | null> {
    return this.usuarios.find((u) => u.id === id) ?? null;
  }
}

export class RefreshTokensEnMemoria implements RefreshTokenRepository {
  readonly filas = new Map<number, RefreshTokenProps>();
  private siguienteId = 1;

  async crear(token: RefreshToken): Promise<RefreshToken> {
    const props = { ...token.snapshot(), id: this.siguienteId++ };
    this.filas.set(props.id, props);
    return RefreshToken.reconstituir(props);
  }

  async buscarPorHash(hash: string): Promise<RefreshToken | null> {
    const props = [...this.filas.values()].find((f) => f.tokenHash === hash);
    return props ? RefreshToken.reconstituir(props) : null;
  }

  async guardar(token: RefreshToken): Promise<void> {
    const props = token.snapshot();
    if (props.id === null) throw new Error('No se puede guardar un token sin id');
    this.filas.set(props.id, props);
  }

  async revocarFamilia(familiaId: string, ahora: Date): Promise<void> {
    for (const [id, fila] of this.filas) {
      if (fila.familiaId === familiaId && fila.revocadoEn === null) {
        this.filas.set(id, { ...fila, revocadoEn: ahora });
      }
    }
  }
}

export class SolicitudesEnMemoria implements SolicitudRepository {
  readonly filas = new Map<number, SolicitudProps>();
  private siguienteId = 1;

  async obtenerPorId(id: number): Promise<Solicitud | null> {
    const props = this.filas.get(id);
    return props ? Solicitud.reconstituir(props) : null;
  }

  async historialPorCedula(cedula: string): Promise<SolicitudPrevia[]> {
    return [...this.filas.values()]
      .filter((p) => p.cedula === cedula)
      .map((p) => ({ id: p.id!, estado: p.estado, fechaNacimiento: p.fechaNacimiento }));
  }

  async crear(solicitud: Solicitud): Promise<Solicitud> {
    const props = { ...solicitud.snapshot(), id: this.siguienteId++ };
    this.filas.set(props.id, props);
    return Solicitud.reconstituir(props);
  }

  async guardar(solicitud: Solicitud): Promise<void> {
    const props = solicitud.snapshot();
    if (props.id === null) throw new Error('No se puede guardar una solicitud sin id');
    this.filas.set(props.id, props);
  }
}

export class CreditosEnMemoria implements CreditoRepository {
  readonly creditos = new Map<number, CreditoProps>();
  readonly cuotas = new Map<number, CuotaPlan[]>();
  private siguienteId = 1;

  async siguienteSecuencia(): Promise<number> {
    return Math.max(0, ...[...this.creditos.values()].map((c) => c.secuencia)) + 1;
  }

  async crear(credito: Credito, cuotas: CuotaPlan[]): Promise<Credito> {
    const props = { ...credito.snapshot(), id: this.siguienteId++ };
    this.creditos.set(props.id, props);
    this.cuotas.set(props.id, cuotas);
    return Credito.reconstituir(props);
  }

  async obtenerPorId(id: number): Promise<Credito | null> {
    const props = this.creditos.get(id);
    return props ? Credito.reconstituir(props) : null;
  }
}

export class DesembolsosEnMemoria implements DesembolsoRepository {
  readonly filas: (NuevoDesembolso & { id: number })[] = [];

  async crear(datos: NuevoDesembolso): Promise<{ id: number }> {
    const fila = { ...datos, id: this.filas.length + 1 };
    this.filas.push(fila);
    return { id: fila.id };
  }
}

export class CatalogosEnMemoria implements CatalogoRepository {
  readonly tiposEmpleo: ItemCatalogo[] = [
    { id: 1, codigo: 'ASALARIADO', nombre: 'Asalariado' },
    { id: 2, codigo: 'INDEPENDIENTE', nombre: 'Independiente' },
  ];
  readonly bancos: (ItemCatalogo & { activo: boolean })[] = [
    { id: 1, codigo: 'LAFISE', nombre: 'LAFISE', activo: true },
    { id: 2, codigo: 'FICOHSA', nombre: 'FICOHSA', activo: true },
    { id: 3, codigo: 'BAC_CREDOMATIC', nombre: 'BAC Credomatic', activo: true },
    { id: 4, codigo: 'BANPRO', nombre: 'Banpro', activo: true },
    { id: 5, codigo: 'CERRADO', nombre: 'Banco cerrado', activo: false },
  ];

  async existeTipoEmpleo(id: number): Promise<boolean> {
    return this.tiposEmpleo.some((t) => t.id === id);
  }

  async bancoActivo(id: number): Promise<boolean> {
    return this.bancos.some((b) => b.id === id && b.activo);
  }

  async listarTiposEmpleo(): Promise<ItemCatalogo[]> {
    return this.tiposEmpleo;
  }

  async listarBancos(): Promise<ItemCatalogo[]> {
    return this.bancos.filter((b) => b.activo).map(({ id, codigo, nombre }) => ({ id, codigo, nombre }));
  }
}

export class RepositoriosEnMemoria implements RepositoriosTx {
  readonly usuarios = new UsuariosEnMemoria();
  readonly refreshTokens = new RefreshTokensEnMemoria();
  readonly solicitudes = new SolicitudesEnMemoria();
  readonly creditos = new CreditosEnMemoria();
  readonly desembolsos = new DesembolsosEnMemoria();
  readonly catalogos = new CatalogosEnMemoria();
}

export class UnitOfWorkEnMemoria implements UnitOfWork {
  ejecuciones = 0;

  constructor(readonly repos = new RepositoriosEnMemoria()) {}

  async run<T>(fn: (repos: RepositoriosTx) => Promise<T>): Promise<T> {
    this.ejecuciones++;
    return fn(this.repos);
  }
}
