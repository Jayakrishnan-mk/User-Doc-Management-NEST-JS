import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import * as fs from 'fs';
import axios from 'axios';

// Mock fs and axios modules
jest.mock('fs');
jest.mock('axios');

// Mock pdf-parse as a function
jest.mock('pdf-parse', () => jest.fn());
import * as pdfParse from 'pdf-parse';

const mockUpdateStatus = jest.fn();

// Mock fs.createReadStream to return a dummy stream with a .path and .name property
(fs.createReadStream as jest.Mock).mockImplementation((filePath: string) => {
  return {
    path: filePath,
    name: 'mockfile',
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    pipe: jest.fn(),
    close: jest.fn(),
    destroy: jest.fn(),
  };
});

// Mock FormData to avoid multipart errors
jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({}),
  }));
});

describe('IngestionService', () => {
  let service: IngestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IngestionService],
    }).compile();
    service = module.get<IngestionService>(IngestionService);
    jest.clearAllMocks();
  });

  describe('processDocument', () => {
    it('should return error if file not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = await service.processDocument(
        { fileUrl: 'test.pdf' },
        mockUpdateStatus,
      );
      expect(result).toEqual({ error: 'File not found for document' });
    });

    it('should handle PDF parsing and VirusTotal scan', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('pdf'));
      (pdfParse as jest.Mock).mockResolvedValue({ text: 'PDF text' });
      service.scanWithVirusTotal = jest
        .fn()
        .mockResolvedValue({ scanId: '123', scanUrl: 'url' });
      const result = await service.processDocument(
        { fileUrl: 'test.pdf' },
        mockUpdateStatus,
      );
      expect(result).toHaveProperty('message', 'PDF parsed');
      expect(result).toHaveProperty('text', 'PDF text');
      expect(result.virusTotal).toHaveProperty('scanId', '123');
    });

    it('should handle OCR and VirusTotal scan for images', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (axios.post as jest.Mock).mockResolvedValue({
        data: { ParsedResults: [{ ParsedText: 'img text' }] },
      });
      service.scanWithVirusTotal = jest
        .fn()
        .mockResolvedValue({ scanId: '456', scanUrl: 'url2' });
      const result = await service.processDocument(
        { fileUrl: 'test.jpg' },
        mockUpdateStatus,
      );
      expect(result).toHaveProperty('message', 'Ingestion complete');
      expect(result.virusTotal).toHaveProperty('scanId', '456');
    });
  });

  describe('scanWithVirusTotal', () => {
    it('should return error if API key not set', async () => {
      process.env.VIRUSTOTAL_API_KEY = '';
      const result = await service.scanWithVirusTotal('file.pdf');
      expect(result).toEqual({ error: 'VirusTotal API key not set' });
    });
    it('should return scanId and scanUrl on success', async () => {
      process.env.VIRUSTOTAL_API_KEY = 'test';
      (axios.post as jest.Mock).mockResolvedValue({
        data: { data: { id: 'abc' } },
      });
      const result = await service.scanWithVirusTotal('file.pdf');
      expect(result).toEqual({ scanId: 'abc', scanUrl: expect.any(String) });
    });
    it('should handle VirusTotal scan error', async () => {
      process.env.VIRUSTOTAL_API_KEY = 'test';
      (axios.post as jest.Mock).mockRejectedValue(new Error('fail'));
      const result = await service.scanWithVirusTotal('file.pdf');
      expect(result).toEqual({
        error: 'VirusTotal scan failed',
        details: 'fail',
      });
    });
  });
});
