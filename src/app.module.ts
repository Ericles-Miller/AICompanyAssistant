import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './database/database.provider';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [TypeOrmModule.forRoot(dataSourceOptions), DocumentsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
