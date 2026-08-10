import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../documents/document.entity';
import { Chunk } from './chunk.entity';
import { EmbeddingsService } from './embeddings.service';
import { splitIntoChunks } from './text-splitter';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(Chunk)
    private readonly chunksRepository: Repository<Chunk>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async chunkAndSave(document: Document, text: string): Promise<Chunk[]> {
    const contents = splitIntoChunks(text);
    const embeddings = await this.embeddingsService.embed(contents, 'document');

    const chunks = contents.map((content, chunkIndex) =>
      this.chunksRepository.create({
        document,
        content,
        chunkIndex,
        embedding: embeddings[chunkIndex],
      }),
    );

    return this.chunksRepository.save(chunks);
  }
}
