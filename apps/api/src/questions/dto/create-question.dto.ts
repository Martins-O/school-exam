import { IsString, IsOptional, IsArray, IsEnum, Length } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @Length(1, 2000)
  questionText: string;

  @IsString()
  @IsEnum(['A', 'B', 'C', 'D', 'E', 'F'])
  correctAnswer: string;

  @IsOptional()
  options?: Record<string, string>;

  @IsOptional()
  marks?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
