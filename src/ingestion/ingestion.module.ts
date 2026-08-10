import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chunk } from './chunk.entity';
import { EmbeddingsService } from './embeddings.service';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chunk])],
  providers: [IngestionService, EmbeddingsService],
  exports: [IngestionService, EmbeddingsService],
})
export class IngestionModule {}
