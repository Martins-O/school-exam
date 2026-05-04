import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { ClassStudent } from './entities/class-student.entity';
import { TeacherClass } from './entities/teacher-class.entity';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { TeacherClassesController } from './teacher-classes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Class, ClassStudent, TeacherClass])],
  controllers: [ClassesController, TeacherClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
