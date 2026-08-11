import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/database.provider';
import { ChatModule } from './chat/chat.module';
import { DocumentsModule } from './documents/documents.module';
import { RetrievalModule } from './retrieval/retrieval.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), DocumentsModule, RetrievalModule, ChatModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
