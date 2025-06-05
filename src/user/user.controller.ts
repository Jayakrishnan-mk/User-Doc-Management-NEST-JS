import {
  Controller,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  Body,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(): Promise<Partial<User>[]> {
    return this.userService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Partial<User>> {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() user: UpdateUserDto,
  ): Promise<Partial<User>> {
    const updated = await this.userService.update(id, user);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.userService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
