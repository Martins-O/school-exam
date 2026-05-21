import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TranscriptsService } from './transcripts.service';
import { GenerateTranscriptDto } from './dto/generate-transcript.dto';

@Controller('transcripts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  @Post('generate')
  @Roles('super_admin', 'administrator')
  async generate(@Body() dto: GenerateTranscriptDto, @Req() req) {
    return this.transcriptsService.generate(dto, req.user);
  }

  @Get()
  @Roles('super_admin', 'administrator')
  async findAll() {
    return this.transcriptsService.findAll();
  }

  @Get('student/:studentId')
  @Roles('super_admin', 'administrator', 'student', 'parent')
  async findByStudent(@Param('studentId') studentId: string, @Req() req) {
    return this.transcriptsService.findByStudent(studentId, req.user);
  }

  @Get(':id')
  @Roles('super_admin', 'administrator', 'student', 'parent')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.transcriptsService.findOne(id, req.user);
  }

  @Patch(':id/finalize')
  @Roles('super_admin', 'administrator')
  async finalize(@Param('id') id: string, @Req() req) {
    return this.transcriptsService.finalize(id, req.user);
  }
}
