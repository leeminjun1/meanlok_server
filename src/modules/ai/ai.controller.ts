import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { DraftDto } from './dto/draft.dto';
import { RefineDto } from './dto/refine.dto';
import { SummarizeDto } from './dto/summarize.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  summarize(@Body() dto: SummarizeDto) {
    return this.aiService.summarize(dto.text);
  }

  @Post('refine')
  refine(@Body() dto: RefineDto) {
    return this.aiService.refine(dto.text);
  }

  @Post('draft')
  draft(@Body() dto: DraftDto) {
    return this.aiService.draft(dto.prompt);
  }
}
