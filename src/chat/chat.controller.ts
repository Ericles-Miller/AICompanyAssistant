import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AskQuestionDto } from './ask-question.dto';
import { ChatService } from './chat.service';
import { MessagesService } from './messages.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async ask(@Body() { userId, question, documentId }: AskQuestionDto) {
    return await this.chatService.ask(userId, question, documentId);
  }

  @Get(':userId/messages')
  async history(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return await this.messagesService.findHistory(userId);
  }
}
