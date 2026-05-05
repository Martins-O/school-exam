import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QuestionCategoriesService } from './question-categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('question-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'administrator', 'teacher')
export class QuestionCategoriesController {
  constructor(private readonly categoriesService: QuestionCategoriesService) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto, @Req() req) {
    return this.categoriesService.create(dto, req.user);
  }

  @Get()
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Req() req) {
    return this.categoriesService.update(id, dto, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.categoriesService.remove(id, req.user);
    return { message: 'Category deleted successfully' };
  }
}
