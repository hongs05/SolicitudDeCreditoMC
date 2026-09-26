const MS_POR_DIA = 86_400_000;

export interface RefreshTokenProps {
  id: number | null;
  usuarioId: number;
  familiaId: string;
  tokenHash: string;
  expiraEn: Date;
  creadoEn: Date;
  revocadoEn: Date | null;
  reemplazadoPorId: number | null;
}

export class RefreshToken {
  private constructor(private props: RefreshTokenProps) {}

  static emitir(p: { usuarioId: number; familiaId: string; tokenHash: string; ahora: Date; ttlDias: number }): RefreshToken {
    return new RefreshToken({
      id: null,
      usuarioId: p.usuarioId,
      familiaId: p.familiaId,
      tokenHash: p.tokenHash,
      creadoEn: p.ahora,
      expiraEn: new Date(p.ahora.getTime() + p.ttlDias * MS_POR_DIA),
      revocadoEn: null,
      reemplazadoPorId: null,
    });
  }

  static reconstituir(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get usuarioId(): number {
    return this.props.usuarioId;
  }

  get familiaId(): string {
    return this.props.familiaId;
  }

  snapshot(): RefreshTokenProps {
    return { ...this.props };
  }

  estaRevocado(): boolean {
    return this.props.revocadoEn !== null;
  }

  estaVigente(ahora: Date): boolean {
    return !this.estaRevocado() && this.props.expiraEn.getTime() > ahora.getTime();
  }

  revocar(ahora: Date): void {
    if (!this.estaRevocado()) this.props = { ...this.props, revocadoEn: ahora };
  }

  rotar(reemplazoId: number, ahora: Date): void {
    this.revocar(ahora);
    this.props = { ...this.props, reemplazadoPorId: reemplazoId };
  }
}
