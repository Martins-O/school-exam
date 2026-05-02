import { IsObject, IsString, IsArray, IsOptional } from 'class-validator';

export class AutosaveDto {
  @IsObject()
  answers: Record<string, string>;

  @IsOptional()
  @IsArray()
  flaggedQuestions?: string[];
}
