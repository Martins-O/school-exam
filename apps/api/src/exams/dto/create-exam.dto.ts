import { IsString, MinLength, MaxLength, IsInt, Min, Max, IsOptional, IsDateString } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(480)
  durationMinutes: number;

  @IsOptional()
  @IsDateString()
  startTime?: Date;

  @IsOptional()
  @IsDateString()
  endTime?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxViolations?: number;
}
