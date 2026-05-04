import { IsString, IsEmail, MinLength, IsEnum, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(['super_admin', 'administrator', 'teacher', 'student', 'parent'])
  role: 'super_admin' | 'administrator' | 'teacher' | 'student' | 'parent';
}
