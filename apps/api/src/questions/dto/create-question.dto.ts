import { IsString, MinLength, IsObject, IsIn, IsInt, Min, IsOptional } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @MinLength(5)
  questionText: string;

  @IsObject()
  options: Record<'A' | 'B' | 'C' | 'D', string>;

  @IsIn(['A', 'B', 'C', 'D'])
  correctAnswer: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  marks?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
