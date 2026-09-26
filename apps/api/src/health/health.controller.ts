import { Controller, Get } from '@nestjs/common';
import { Public } from '../shared/infrastructure/http/publico.decorator';
import { PrismaService } from '../shared/infrastructure/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async verificar(): Promise<{ status: 'ok' }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }
}
