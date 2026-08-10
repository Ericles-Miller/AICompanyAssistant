import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Document } from '../documents/document.entity';

@Entity('chunks')
export class Chunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, (document) => document.chunks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'vector', length: 1024, nullable: true })
  embedding: number[];

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number;
}
