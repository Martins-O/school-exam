import { IsString, IsOptional, IsArray, Length, IsObject, IsInt, Min } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  questionText?: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, string>;

  @IsOptional()
  @IsString()
  @Length(1, 1)
  correctAnswer?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  marks?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[];
}
