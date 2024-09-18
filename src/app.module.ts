import { Module } from '@nestjs/common';
import { EmailParserModule } from './email-parser.module';

@Module({
  imports: [EmailParserModule],
})
export class AppModule {}
