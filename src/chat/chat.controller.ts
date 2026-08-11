import { Body, Controller, Post } from '@nestjs/common';
import { AskQuestionDto } from './ask-question.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async ask(@Body() { userId, question, documentId }: AskQuestionDto) {
    return await this.chatService.ask(userId, question, documentId);
  }
}
