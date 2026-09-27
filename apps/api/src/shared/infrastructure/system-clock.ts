import { fechaEnZona } from '@credito/domain';
import type { Clock } from '../application/ports/clock';

export class SystemClock implements Clock {
  constructor(
    private readonly zona: string,
    private readonly reloj: () => Date = () => new Date(),
  ) {}

  ahora(): Date {
    return this.reloj();
  }

  hoy(): string {
    return fechaEnZona(this.reloj(), this.zona);
  }
}
