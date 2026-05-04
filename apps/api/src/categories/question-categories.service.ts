import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionCategory } from './entities/question-category.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class QuestionCategoriesService {
  constructor(
    @InjectRepository(QuestionCategory)
    private readonly categoryRepo: Repository<QuestionCategory>,
  ) {}

  async create(dto: { name: string; description?: string }, user: any): Promise<QuestionCategory> {
    const category = this.categoryRepo.create({
      name: dto.name,
      description: dto.description,
      createdBy: user,
      createdById: user.id,
    });
    return this.categoryRepo.save(category);
  }

  async findAll(): Promise<QuestionCategory[]> {
    return this.categoryRepo.find({ relations: ['createdBy'] });
  }

  async findOne(id: string): Promise<QuestionCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: string, dto: { name?: string; description?: string }): Promise<QuestionCategory> {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepo.remove(category);
  }

  async findByIds(ids: string[]): Promise<QuestionCategory[]> {
    if (!ids || ids.length === 0) return [];
    return this.categoryRepo.findByIds(ids);
  }
}
