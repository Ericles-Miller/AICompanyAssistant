import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../documents/document.entity';
import { Chunk } from './chunk.entity';
import { splitIntoChunks } from './text-splitter';

@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(Chunk)
    private readonly chunksRepository: Repository<Chunk>,
  ) {}

  async chunkAndSave(document: Document, text: string): Promise<Chunk[]> {
    const contents = splitIntoChunks(text);

    const chunks = contents.map((content, chunkIndex) =>
      this.chunksRepository.create({ document, content, chunkIndex }),
    );

    return this.chunksRepository.save(chunks);
  }
}
