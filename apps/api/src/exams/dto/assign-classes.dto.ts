import { IsArray, IsString, IsUUID } from 'class-validator';

export class AssignClassesDto {
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  classIds: string[];
}
