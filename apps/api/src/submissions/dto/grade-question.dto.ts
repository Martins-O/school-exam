import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class GradeQuestionDto {
  @IsInt()
  @Min(0)
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
