import { Prisma } from '@prisma/client';

export type ClientePrisma = Prisma.TransactionClient;

export const aNumero = (valor: Prisma.Decimal): number => valor.toNumber();

export const aDecimal = (valor: number): Prisma.Decimal => new Prisma.Decimal(valor.toFixed(2));
