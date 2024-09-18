import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { EmailParserService } from './email-parser.service';
import { ParsedEmailDto } from './dto/parsed-email.dto';
import { EmailParseRequestDto } from './dto/email-parse-request.dto';
import * as path from 'path';

@Controller('email-parser')
export class EmailParserController {
  constructor(private readonly emailParserService: EmailParserService) {}

  @Get('parse')
  async parseEmail(
    @Query(ValidationPipe) query: EmailParseRequestDto,
  ): Promise<ParsedEmailDto> {
    const absolutePath = path.resolve(query.path);
    return this.emailParserService.parseEmailAndExtractJson(absolutePath);
  }
}
