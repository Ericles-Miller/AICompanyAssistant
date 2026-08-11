import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class AskQuestionDto {
  @IsUUID()
  @ApiProperty({ type: String })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  question: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    type: String,
    description:
      'Se informado, usa o documento inteiro como contexto (ex: quiz, resumo, plano de estudos) em vez de buscar os trechos mais relevantes.',
  })
  documentId?: string;
}
