import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    // eslint-disable-next-line prettier/prettier
  ) { }

  @Post('register')
  async register(
    @Body() body: { username: string; password: string; role?: string },
  ) {
    const userRole =
      body.role && Object.values(UserRole).includes(body.role as UserRole)
        ? (body.role as UserRole)
        : UserRole.VIEWER;
    return this.authService.register({ ...body, role: userRole });
  }

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }
}
