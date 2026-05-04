import { IsString, IsUUID } from 'class-validator';

export class LinkStudentDto {
  @IsString()
  @IsUUID()
  studentId: string;
}
