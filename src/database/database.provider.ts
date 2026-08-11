import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';
import { Message } from '../chat/message.entity';
import { Document } from '../documents/document.entity';
import { Chunk } from '../ingestion/chunk.entity';
import { User } from '../users/user.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: Number(process.env.DATABASE_PORT),
  synchronize: true,
  entities: [Document, Chunk, User, Message],
  migrations: [],
  logging: process.env.NODE_ENV === 'development' ? true : false,
};

export default new DataSource(dataSourceOptions);
