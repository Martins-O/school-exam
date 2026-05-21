import { IsArray, IsString, IsUUID } from 'class-validator';

export class AssignTeachersDto {
  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  teacherIds: string[];
}
