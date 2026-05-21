import { IsArray, IsString, IsUUID } from 'class-validator';

export class AddStudentsDto {
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  studentIds: string[];
}
