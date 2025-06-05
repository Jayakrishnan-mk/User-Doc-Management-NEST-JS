import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  validateUser: jest.fn(),
};

const mockUserService = {
  findById: jest.fn(),
  findByUsername: jest.fn(),
  findByUsernameWithPassword: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user', async () => {
    mockAuthService.register.mockResolvedValue({ id: 1, username: 'test' });
    const result = await controller.register({
      username: 'test',
      password: 'pass',
    });
    expect(result).toEqual({ id: 1, username: 'test' });
  });

  it('should login a user', async () => {
    mockAuthService.validateUser.mockResolvedValue({
      id: 1,
      username: 'test',
      password: 'pass',
      role: 'USER',
    });
    mockAuthService.login.mockResolvedValue({ access_token: 'jwt-token' });
    const result = await controller.login({
      username: 'test',
      password: 'pass',
    });
    expect(result).toEqual({ access_token: 'jwt-token' });
  });
});
