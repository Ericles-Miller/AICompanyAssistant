import { HttpException, InternalServerErrorException } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AskQuestionDto } from './ask-question.dto';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('chat:ask')
  async handleAsk(@MessageBody() { userId, question, documentId }: AskQuestionDto, @ConnectedSocket() client: Socket) {
    try {
      const stream = this.chatService.askStream(userId, question, documentId);

      let result = await stream.next();
      while (!result.done) {
        client.emit('chat:chunk', result.value);
        result = await stream.next();
      }

      client.emit('chat:done', result.value);
    } catch (error) {
      const exception = error instanceof HttpException ? error : new InternalServerErrorException('Erro inesperado');

      client.emit('chat:error', { statusCode: exception.getStatus(), message: exception.message });
    }
  }
}
