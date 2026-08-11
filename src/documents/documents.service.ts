import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDFParse } from 'pdf-parse';
import { Repository } from 'typeorm';
import { AwsS3Service } from '../aws/s3/aws-S3.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { Document } from './document.entity';

// pdf-parse insere marcadores tipo "-- 1 of 1 --" entre páginas, mesmo quando
// a página não tem texto nenhum, então não servem como conteúdo real do chunk.
function stripPageMarkers(text: string): string {
  return text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '').trim();
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    private readonly awsS3Service: AwsS3Service,
    private readonly ingestionService: IngestionService,
  ) {}

  async ingest(file: Express.Multer.File) {
    const parser = new PDFParse({ data: file.buffer });
    const { text } = await parser.getText();
    await parser.destroy();

    const cleanText = stripPageMarkers(text);

    if (!cleanText) {
      throw new BadRequestException(
        'Não foi possível extrair texto deste PDF. Ele pode ser um documento escaneado (imagem) sem OCR.',
      );
    }

    const storageKey = `documents/${randomUUID()}-${file.originalname}`;
    await this.awsS3Service.upload(storageKey, file.buffer, file.mimetype);

    const document = await this.documentsRepository.save(
      this.documentsRepository.create({ filename: file.originalname, storageKey }),
    );

    const chunks = await this.ingestionService.chunkAndSave(document, cleanText);

    return {
      document,
      chunksCreated: chunks.length,
    };
  }

  async findById(id: string): Promise<Document | null> {
    return await this.documentsRepository.findOneBy({ id });
  }

  async findAll(): Promise<Document[]> {
    return await this.documentsRepository.find({ order: { uploadedAt: 'DESC' } });
  }
}
