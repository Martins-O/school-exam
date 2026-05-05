import { IsString, IsOptional, IsArray, IsEnum, Length, IsObject, IsInt, Min } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @Length(1, 5000)
  questionText: string;

  @IsEnum(['objective', 'theory'])
  @IsOptional()
  type?: 'objective' | 'theory';

  @IsOptional()
  @IsString()
  @Length(1, 1)
  correctAnswer?: string;

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
