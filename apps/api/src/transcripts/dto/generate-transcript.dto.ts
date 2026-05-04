import { IsString, IsOptional, IsUUID } from 'class-validator';

export class GenerateTranscriptDto {
  @IsString()
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsString()
  periodStart?: string;

  @IsOptional()
  @IsString()
  periodEnd?: string;

  @IsOptional()
  @IsString()
  comments?: string;
}
