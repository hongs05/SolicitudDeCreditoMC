import type { Rol } from '@credito/domain';
import { SetMetadata } from '@nestjs/common';

export const ROLES = 'roles';
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES, roles);
