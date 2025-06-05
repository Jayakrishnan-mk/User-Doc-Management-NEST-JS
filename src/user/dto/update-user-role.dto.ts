import { IsEnum } from 'class-validator';
import { UserRole } from '../user.entity';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
