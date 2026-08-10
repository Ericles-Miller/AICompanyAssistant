import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chunk } from '../ingestion/chunk.entity';
import { IngestionModule } from '../ingestion/ingestion.module';
import { RetrievalService } from './retrieval.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chunk]), IngestionModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
