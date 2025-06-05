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
import { DocumentService } from '../document/document.service';
import { IngestionService } from './ingestion.service';

@Controller('ingestion')
@UseGuards(AuthGuard('jwt'))
export class IngestionController {
  constructor(
    private readonly documentService: DocumentService,
    private readonly ingestionService: IngestionService,
  ) {}

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
    return this.ingestionService.processDocument(
      doc,
      async (status: string) => {
        await this.documentService.update(body.documentId, {
          ingestionStatus: status,
        });
      },
    );
  }

  // Get ingestion status for a document by ID
  @Get('status/:id')
  async getStatus(@Param('id', ParseIntPipe) id: number) {
    const doc = await this.documentService.findById(id);
    return { documentId: id, status: doc?.ingestionStatus ?? 'pending' };
  }
}
