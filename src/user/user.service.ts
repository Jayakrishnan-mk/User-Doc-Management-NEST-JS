import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.userRepository.find();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ password, ...rest }) => rest);
  }

  async findById(id: number): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  async findByUsername(username: string): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOneBy({ username });
    if (!user) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    return rest;
  }

  // Internal use only: returns full user entity including password
  async findByUsernameWithPassword(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async create(user: Partial<User>): Promise<Partial<User>> {
    // Check if username already exists
    if (user.username) {
      const existing = await this.userRepository.findOneBy({
        username: user.username,
      });
      if (existing) {
        throw new BadRequestException('Username already exists');
      }
    }
    const newUser = this.userRepository.create(user);
    const savedUser = await this.userRepository.save(newUser);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = savedUser;
    return rest;
  }

  async update(id: number, user: Partial<User>): Promise<Partial<User> | null> {
    await this.userRepository.update(id, user);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async delete(id: number) {
    return this.userRepository.delete(id);
  }
}
