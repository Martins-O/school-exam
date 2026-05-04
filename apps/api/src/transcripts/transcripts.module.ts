import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transcript } from './entities/transcript.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { User } from '../users/entities/user.entity';
import { TranscriptsService } from './transcripts.service';
import { TranscriptsController } from './transcripts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transcript, Submission, User])],
  controllers: [TranscriptsController],
  providers: [TranscriptsService],
  exports: [TranscriptsService],
})
export class TranscriptsModule {}
