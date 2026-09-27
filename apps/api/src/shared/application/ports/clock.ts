export interface Clock {
  ahora(): Date;
  hoy(): string;
}

export const CLOCK = Symbol('Clock');
