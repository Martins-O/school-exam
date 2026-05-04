import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentStudent } from './entities/parent-student.entity';
import { User } from '../users/entities/user.entity';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';
import { ResultsModule } from '../results/results.module';

@Module({
  imports: [TypeOrmModule.forFeature([ParentStudent, User]), ResultsModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
