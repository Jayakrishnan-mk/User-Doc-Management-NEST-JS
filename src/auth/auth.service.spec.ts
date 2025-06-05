import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

const mockUserService = {
  findByUsernameWithPassword: jest.fn(),
  create: jest.fn(),
};
const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a user', async () => {
    mockUserService.create.mockResolvedValue({ id: 1, username: 'test' });
    const result = await service.register({
      username: 'test',
      password: 'pass',
    });
    expect(result).toEqual({ id: 1, username: 'test' });
  });

  it('should login a user and return JWT', async () => {
    const user = { id: 1, username: 'test', password: 'hashed', role: 'USER' };
    mockUserService.findByUsernameWithPassword.mockResolvedValue(user);
    mockJwtService.sign.mockReturnValue('jwt-token');
    jest
      .spyOn(bcrypt, 'compare')
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .mockImplementation(() => Promise.resolve(true));
    // Simulate the full login flow: validateUser + login
    const validated = await service.validateUser('test', 'pass');
    const result = service.login(validated as any);
    expect(result).toEqual({ access_token: 'jwt-token' });
  });

  it('should throw on invalid login', async () => {
    mockUserService.findByUsernameWithPassword.mockResolvedValue({
      id: 1,
      username: 'bad',
      password: 'hashed',
      role: 'USER',
    });
    mockJwtService.sign.mockReturnValue('jwt-token');
    (bcrypt.compare as unknown as jest.Mock).mockResolvedValue(false);
    await expect(service.validateUser('bad', 'bad')).resolves.toBeNull();
  });
});
