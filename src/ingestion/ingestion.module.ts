import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [DocumentModule],
  controllers: [IngestionController],
})
export class IngestionModule {}
