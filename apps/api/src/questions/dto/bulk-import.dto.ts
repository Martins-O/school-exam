import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateQuestionDto } from './create-question.dto';

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
