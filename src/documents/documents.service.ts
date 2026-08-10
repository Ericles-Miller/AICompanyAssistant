import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PDFParse } from 'pdf-parse';
import { Repository } from 'typeorm';
import { AwsS3Service } from '../aws/s3/aws-S3.service';
import { Document } from './document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  async ingest(file: Express.Multer.File) {
    const parser = new PDFParse({ data: file.buffer });
    const { text } = await parser.getText();
    await parser.destroy();

    const storageKey = `documents/${randomUUID()}-${file.originalname}`;
    await this.awsS3Service.upload(storageKey, file.buffer, file.mimetype);

    const document = await this.documentsRepository.save(
      this.documentsRepository.create({ filename: file.originalname, storageKey }),
    );

    return {
      document,
      extractedTextLength: text.length,
      extractedTextPreview: text.slice(0, 300),
    };
  }
}
