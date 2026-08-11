import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(name: string): Promise<User> {
    return await this.usersRepository.save(this.usersRepository.create({ name }));
  }

  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findOneBy({ id });
  }
}
