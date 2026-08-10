import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chunk } from '../ingestion/chunk.entity';
import { EmbeddingsService } from '../ingestion/embeddings.service';

const TOP_K = 5;

export interface RetrievedChunk {
  id: string;
  content: string;
  filename: string;
  distance: number;
}

@Injectable()
export class RetrievalService {
  constructor(
    @InjectRepository(Chunk)
    private readonly chunksRepository: Repository<Chunk>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async search(question: string): Promise<RetrievedChunk[]> {
    const [questionEmbedding] = await this.embeddingsService.embed([question], 'query');
    const vectorLiteral = `[${questionEmbedding.join(',')}]`;

    return this.chunksRepository.query(
      `select c.id, c.content, d.filename, c.embedding <=> $1::vector as distance
       from chunks c
       join documents d on d.id = c.document_id
       order by c.embedding <=> $1::vector
       limit $2`,
      [vectorLiteral, TOP_K],
    );
  }
}
