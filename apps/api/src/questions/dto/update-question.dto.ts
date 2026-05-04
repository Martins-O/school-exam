import { IsString, IsOptional, IsArray, Length } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  questionText?: string;

  @IsOptional()
  options?: Record<string, string>;

  @IsOptional()
  correctAnswer?: string;

  @IsOptional()
  marks?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
