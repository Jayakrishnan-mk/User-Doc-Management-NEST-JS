import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import axios from 'axios';
import * as fs from 'fs';
import { DocumentService } from '../document/document.service';
import * as FormData from 'form-data';
import * as pdfParse from 'pdf-parse';

@Controller('ingestion')
@UseGuards(AuthGuard('jwt'))
export class IngestionController {
  constructor(private readonly documentService: DocumentService) {}

  // Trigger ingestion for a document by ID
  @Post('trigger')
  async triggerIngestion(@Body() body: { documentId: number }) {
    await this.documentService.update(body.documentId, {
      ingestionStatus: 'processing',
    });
    const doc = await this.documentService.findById(body.documentId);
    if (!doc || !doc.fileUrl) {
      await this.documentService.update(body.documentId, {
        ingestionStatus: 'failed',
      });
      return { error: 'Document or fileUrl not found' };
    }
    const filePath = doc.fileUrl.startsWith('/')
      ? doc.fileUrl.slice(1)
      : doc.fileUrl;
    if (!fs.existsSync(filePath)) {
      await this.documentService.update(body.documentId, {
        ingestionStatus: 'failed',
      });
      return { error: 'File not found for document' };
    }
    // If PDF, use pdf-parse for full text extraction
    if (filePath.toLowerCase().endsWith('.pdf')) {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        // VirusTotal scan for PDF
        const vtResult = await this.scanWithVirusTotal(filePath);
        await this.documentService.update(body.documentId, {
          ingestionStatus: 'complete',
        });
        return {
          message: 'PDF parsed',
          text: pdfData.text,
          virusTotal: {
            ...vtResult,
            note: 'VirusTotal scan may take several minutes. Please check the scanUrl later for results.',
          },
        };
      } catch (err) {
        await this.documentService.update(body.documentId, {
          ingestionStatus: 'failed',
        });
        return { error: 'PDF parsing failed', details: err.message };
      }
    }
    // Otherwise, use OCR.Space for images (Optical Character Recognition)
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('apikey', process.env.OCR_SPACE_API_KEY);
    try {
      const response = await axios.post(
        'https://api.ocr.space/parse/image',
        form,
        {
          headers: form.getHeaders(),
        },
      );
      // VirusTotal scan for image
      const vtResult = await this.scanWithVirusTotal(filePath);
      await this.documentService.update(body.documentId, {
        ingestionStatus: 'complete',
      });
      return {
        message: 'Ingestion complete',
        ocrResult: response.data,
        virusTotal: {
          ...vtResult,
          note: 'VirusTotal scan may take several minutes. Please check the scanUrl later for results.',
        },
      };
    } catch (err) {
      await this.documentService.update(body.documentId, {
        ingestionStatus: 'failed',
      });
      return { error: 'OCR failed', details: err.message };
    }
  }

  // Get ingestion status for a document by ID
  @Get('status/:id')
  async getStatus(@Param('id', ParseIntPipe) id: number) {
    const doc = await this.documentService.findById(id);
    return { documentId: id, status: doc?.ingestionStatus ?? 'pending' };
  }

  // Helper: Scan file with VirusTotal
  private async scanWithVirusTotal(filePath: string) {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) return { error: 'VirusTotal API key not set' };
    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
      const response = await axios.post(
        'https://www.virustotal.com/api/v3/files',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-apikey': apiKey,
          },
        },
      );
      // The scan is asynchronous; return scan id/link for user to check
      const scanId = response.data.data.id;
      const scanUrl = `https://www.virustotal.com/gui/file/${scanId}/detection`;
      return { scanId, scanUrl };
    } catch (err) {
      return { error: 'VirusTotal scan failed', details: err.message };
    }
  }
}
