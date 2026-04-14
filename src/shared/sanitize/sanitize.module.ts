import { Global, Module } from '@nestjs/common';
import { SanitizeService } from './sanitize.service';

@Global()
@Module({
  providers: [SanitizeService],
  exports: [SanitizeService],
})
export class SanitizeModule {}
