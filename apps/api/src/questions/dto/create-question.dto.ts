import { IsString, IsOptional, IsArray, IsEnum, Length, IsObject, IsInt, Min } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @Length(1, 2000)
  questionText: string;

  @IsString()
  @Length(1, 1)
  correctAnswer: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, string>;

  @IsOptional()
  @IsInt()
  @Min(1)
  marks?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
