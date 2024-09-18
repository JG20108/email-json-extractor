import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { EmailParserService } from './email-parser.service';
import { ParsedEmailDto } from './dto/parsed-email.dto';
import { EmailParseRequestDto } from './dto/email-parse-request.dto';

@Controller('email-parser')
export class EmailParserController {
  constructor(private readonly emailParserService: EmailParserService) {}

  @Get('parse')
  async parseEmail(
    @Query(ValidationPipe) query: EmailParseRequestDto,
  ): Promise<ParsedEmailDto> {
    return this.emailParserService.parseEmailAndExtractJson(query.path);
  }
}
