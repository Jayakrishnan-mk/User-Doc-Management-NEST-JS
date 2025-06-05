import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

const mockUserService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();
    controller = module.get<UserController>(UserController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get all users', async () => {
    mockUserService.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await controller.findAll();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should get user by id', async () => {
    mockUserService.findById.mockResolvedValue({ id: 1 });
    const result = await controller.findById(1);
    expect(result).toEqual({ id: 1 });
  });

  it('should update a user', async () => {
    mockUserService.update.mockResolvedValue({ id: 1, username: 'updated' });
    const mockRequest = {
      user: { id: 1, role: 'USER' },
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
      acceptsEncodings: jest.fn(),
      acceptsLanguages: jest.fn(),
      is: jest.fn(),
    } as any;
    const result = await controller.update(
      1,
      { username: 'updated' },
      mockRequest,
    );
    expect(result).toEqual({ id: 1, username: 'updated' });
  });

  it('should delete a user', async () => {
    mockUserService.remove.mockResolvedValue(undefined);
    const result = await controller.remove(1);
    expect(result).toEqual({ message: 'User deleted successfully' });
  });
});
