import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QuestionCategory } from './entities/question-category.entity';

@Injectable()
export class QuestionCategoriesService {
  constructor(
    @InjectRepository(QuestionCategory)
    private readonly categoryRepo: Repository<QuestionCategory>,
  ) {}

  async create(dto: { name: string; description?: string }, user: any): Promise<QuestionCategory> {
    const existing = await this.categoryRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Category '${dto.name}' already exists`);
    }
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

  async update(id: string, dto: { name?: string; description?: string }, user?: any): Promise<QuestionCategory> {
    const category = await this.findOne(id);
    if (user && user.role === 'teacher' && category.createdById !== user.id) {
      throw new ForbiddenException('You can only modify your own categories');
    }
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string, user?: any): Promise<void> {
    const category = await this.findOne(id);
    if (user && user.role === 'teacher' && category.createdById !== user.id) {
      throw new ForbiddenException('You can only delete your own categories');
    }
    await this.categoryRepo.remove(category);
  }

  async findByIds(ids: string[]): Promise<QuestionCategory[]> {
    if (!ids || ids.length === 0) return [];
    return this.categoryRepo.findBy({ id: In(ids) });
  }
}
