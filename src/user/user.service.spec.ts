import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    mockUserRepository.create.mockReturnValue({ username: 'test' });
    mockUserRepository.save.mockResolvedValue({ id: 1, username: 'test' });
    const result = await service.create({
      username: 'test',
      password: 'pass',
    } as any);
    expect(result).toHaveProperty('id', 1);
    expect(mockUserRepository.save).toHaveBeenCalled();
  });

  it('should find all users', async () => {
    mockUserRepository.find.mockResolvedValue([{ id: 1 }]);
    const result = await service.findAll();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should find user by id', async () => {
    mockUserRepository.findOneBy.mockResolvedValue({ id: 1 });
    const result = await service.findById(1);
    expect(result).toEqual({ id: 1 });
  });

  it('should update a user', async () => {
    mockUserRepository.update.mockResolvedValue({ affected: 1 });
    mockUserRepository.findOneBy.mockResolvedValue({
      id: 1,
      username: 'updated',
    });
    const result = await service.update(1, { username: 'updated' });
    expect(result).toEqual({ id: 1, username: 'updated' });
  });

  it('should delete a user', async () => {
    mockUserRepository.delete.mockResolvedValue({ affected: 1 });
    const result = await service.delete(1);
    expect(result).toEqual({ affected: 1 });
  });
});
