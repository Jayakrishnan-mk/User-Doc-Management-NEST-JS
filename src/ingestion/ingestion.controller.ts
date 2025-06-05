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

@Controller('ingestion')
@UseGuards(AuthGuard('jwt'))
export class IngestionController {
  constructor(private readonly documentService: DocumentService) {}

  // Trigger ingestion for a document by ID
  @Post('trigger')
  async triggerIngestion(@Body() body: { documentId: number }) {
    // Set status to processing in DB
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
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('apikey', process.env.OCR_SPACE_API_KEY);
    // OCR request to OCR.Space - Optical Character Recognition
    try {
      const response = await axios.post(
        'https://api.ocr.space/parse/image',
        form,
        {
          headers: form.getHeaders(),
        },
      );
      await this.documentService.update(body.documentId, {
        ingestionStatus: 'complete',
      });
      return { message: 'Ingestion complete', ocrResult: response.data };
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
}
