// Decorator pattern: This custom decorator attaches role metadata to route handlers
// for use by guards (OCP, SRP)
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../user/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
