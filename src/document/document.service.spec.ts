import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from './document.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document } from './document.entity';

const mockDocumentRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
};

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(Document),
          useValue: mockDocumentRepository,
        },
      ],
    }).compile();
    service = module.get<DocumentService>(DocumentService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a document', async () => {
    mockDocumentRepository.save.mockResolvedValue({ id: 1, title: 'doc' });
    const mockUser = { id: 1 } as any; // Mock User object
    const result = await service.create({ title: 'doc' } as any, mockUser);
    expect(result).toHaveProperty('id', 1);
    expect(mockDocumentRepository.save).toHaveBeenCalled();
  });

  it('should find all documents', async () => {
    mockDocumentRepository.find.mockResolvedValue([{ id: 1 }]);
    const result = await service.findAll();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should find document by id', async () => {
    mockDocumentRepository.findOne.mockResolvedValue({ id: 1 });
    const result = await service.findById(1);
    expect(result).toEqual({ id: 1 });
  });

  it('should update a document', async () => {
    mockDocumentRepository.update.mockResolvedValue({ affected: 1 });
    mockDocumentRepository.findOne.mockResolvedValue({
      id: 1,
      title: 'updated',
    });
    const result = await service.update(1, { title: 'updated' });
    expect(result).toEqual({ id: 1, title: 'updated' });
  });

  it('should delete a document', async () => {
    mockDocumentRepository.delete.mockResolvedValue({ affected: 1 });
    const result = await service.delete(1);
    expect(result).toEqual({ affected: 1 });
  });
});
