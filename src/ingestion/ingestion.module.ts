import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chunk } from './chunk.entity';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Chunk])],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
