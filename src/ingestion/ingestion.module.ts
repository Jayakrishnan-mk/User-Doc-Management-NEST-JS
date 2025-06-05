import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [DocumentModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
