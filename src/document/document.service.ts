import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import { User } from '../user/user.entity';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async findAll(): Promise<Partial<Document>[]> {
    const docs = await this.documentRepository.find({ relations: ['owner'] });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return docs.map(({ owner, ...rest }) => rest);
  }

  async findById(id: number): Promise<Partial<Document> | null> {
    const doc = await this.documentRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!doc) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { owner, ...rest } = doc;
    return rest;
  }

  async create(
    docData: Partial<Document>,
    owner: User,
  ): Promise<Partial<Document>> {
    const doc = this.documentRepository.create({ ...docData, owner });
    const saved = await this.documentRepository.save(doc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { owner: _, ...rest } = saved;
    return rest;
  }

  async update(
    id: number,
    docData: Partial<Document>,
    user: User,
  ): Promise<Partial<Document> | null> {
    const doc = await this.documentRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!doc) return null;
    if (doc.owner.id !== user.id)
      throw new ForbiddenException('Not your document');
    await this.documentRepository.update(id, docData);
    return this.findById(id);
  }

  async remove(id: number, user: User): Promise<void> {
    const doc = await this.documentRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.owner.id !== user.id)
      throw new ForbiddenException('Not your document');
    await this.documentRepository.delete(id);
  }
}
