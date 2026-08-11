import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageRole } from './message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
  ) {}

  async findHistory(userId: string): Promise<Message[]> {
    return await this.messagesRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'ASC' },
    });
  }

  async save(userId: string, role: MessageRole, content: string): Promise<Message> {
    return await this.messagesRepository.save(this.messagesRepository.create({ user: { id: userId }, role, content }));
  }
}
