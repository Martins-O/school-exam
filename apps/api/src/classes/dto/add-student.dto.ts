import { IsString, IsUUID } from 'class-validator';

export class AddStudentDto {
  @IsString()
  @IsUUID()
  studentId: string;
}
