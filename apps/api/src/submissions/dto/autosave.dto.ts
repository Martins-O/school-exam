import { IsObject, IsString, IsArray, IsOptional } from 'class-validator';

export class AutosaveDto {
  @IsOptional()
  @IsObject()
  answers?: Record<string, string>;

  @IsOptional()
  @IsArray()
  flaggedQuestions?: string[];
}
