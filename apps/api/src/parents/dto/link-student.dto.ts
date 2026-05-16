import { IsString, IsUUID } from 'class-validator';

export class LinkStudentDto {
  @IsString()
  @IsUUID()
  parentId: string;

  @IsString()
  @IsUUID()
  studentId: string;
}
