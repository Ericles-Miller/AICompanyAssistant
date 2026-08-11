import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsModule } from '../documents/documents.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), RetrievalModule, UsersModule, DocumentsModule],
  controllers: [ChatController],
  providers: [ChatService, MessagesService],
})
export class ChatModule {}
