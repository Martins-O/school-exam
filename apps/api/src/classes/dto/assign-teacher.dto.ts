import { IsString, IsUUID } from 'class-validator';

export class AssignTeacherDto {
  @IsString()
  @IsUUID()
  teacherId: string;
}
