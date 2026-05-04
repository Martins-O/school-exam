import { IsString, IsOptional, Length } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
