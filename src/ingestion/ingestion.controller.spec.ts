import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { DocumentService } from '../document/document.service';
import { IngestionService } from './ingestion.service';

const mockDocumentService = {
  update: jest.fn(),
  findById: jest.fn(),
};
const mockIngestionService = {
  processDocument: jest.fn(),
};

describe('IngestionController', () => {
  let controller: IngestionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        { provide: DocumentService, useValue: mockDocumentService },
        { provide: IngestionService, useValue: mockIngestionService },
      ],
    }).compile();
    controller = module.get<IngestionController>(IngestionController);
    jest.clearAllMocks();
  });

  describe('triggerIngestion', () => {
    it('should return error if document not found', async () => {
      mockDocumentService.findById.mockResolvedValue(null);
      const result = await controller.triggerIngestion({ documentId: 1 });
      expect(result).toEqual({ error: 'Document or fileUrl not found' });
    });

    it('should delegate to ingestionService.processDocument if document found', async () => {
      mockDocumentService.findById.mockResolvedValue({ fileUrl: 'test.pdf' });
      mockIngestionService.processDocument.mockResolvedValue({ message: 'ok' });
      const result = await controller.triggerIngestion({ documentId: 1 });
      expect(mockIngestionService.processDocument).toHaveBeenCalled();
      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('getStatus', () => {
    it('should return status for document', async () => {
      mockDocumentService.findById.mockResolvedValue({
        ingestionStatus: 'complete',
      });
      const result = await controller.getStatus(1);
      expect(result).toEqual({ documentId: 1, status: 'complete' });
    });
    it('should return pending if doc not found', async () => {
      mockDocumentService.findById.mockResolvedValue(null);
      const result = await controller.getStatus(2);
      expect(result).toEqual({ documentId: 2, status: 'pending' });
    });
  });
});
