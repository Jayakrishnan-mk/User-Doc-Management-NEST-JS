import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

const mockDocumentService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
};

describe('DocumentController', () => {
  let controller: DocumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [{ provide: DocumentService, useValue: mockDocumentService }],
    }).compile();
    controller = module.get<DocumentController>(DocumentController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a document', async () => {
    mockDocumentService.create.mockResolvedValue({ id: 1, title: 'doc' });
    const mockRequest = {
      user: { id: 1 },
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
      acceptsEncodings: jest.fn(),
      acceptsLanguages: jest.fn(),
      is: jest.fn(),
    } as any;

    const result = await controller.create(
      { title: 'doc' } as any,
      mockRequest,
    );
    expect(result).toEqual({ id: 1, title: 'doc' });
  });

  it('should get all documents', async () => {
    mockDocumentService.findAll.mockResolvedValue([{ id: 1 }]);
    const result = await controller.findAll();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should get document by id', async () => {
    mockDocumentService.findById.mockResolvedValue({ id: 1 });
    const result = await controller.findById(1);
    expect(result).toEqual({ id: 1 });
  });

  it('should update a document', async () => {
    mockDocumentService.update.mockResolvedValue({ id: 1, title: 'updated' });
    const mockRequest = {
      user: { id: 1 },
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
      { title: 'updated' },
      mockRequest,
    );
    expect(result).toEqual({ id: 1, title: 'updated' });
  });

  it('should delete a document', async () => {
    mockDocumentService.remove.mockResolvedValue(undefined);
    const mockRequest = {
      user: { id: 1 },
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
      acceptsEncodings: jest.fn(),
      acceptsLanguages: jest.fn(),
      is: jest.fn(),
    } as any;

    const result = await controller.delete(1, mockRequest);
    expect(result).toEqual({ message: 'Document deleted' });
  });
});
