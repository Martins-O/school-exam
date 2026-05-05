import { IsString, IsOptional, IsArray, IsEnum, Length, IsObject, IsInt, Min } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @Length(1, 5000)
  questionText?: string;

  @IsOptional()
  @IsEnum(['objective', 'theory'])
  type?: 'objective' | 'theory';

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

  @IsOptional()
  @IsString()
  pdfAttachment?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxWordCount?: number;

  @IsOptional()
  @IsString()
  passageText?: string;
}
