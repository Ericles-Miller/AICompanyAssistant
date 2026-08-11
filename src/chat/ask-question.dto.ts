import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ type: String })
  question: string;
}
