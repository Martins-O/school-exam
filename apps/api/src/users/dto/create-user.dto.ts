import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsEnum(['super_admin', 'administrator', 'teacher', 'student', 'parent'])
  role: 'super_admin' | 'administrator' | 'teacher' | 'student' | 'parent';
}
