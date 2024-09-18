import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ParseEmailUseCase } from '../../application/use-cases/parse-email.use-case';
import { ParsedEmailDto } from '../../application/dto/parsed-email.dto';
import { EmailParseRequestDto } from '../../application/dto/email-parse-request.dto';
import * as path from 'path';

@Controller('email-parser')
export class EmailParserController {
  constructor(private readonly parseEmailUseCase: ParseEmailUseCase) {}

  @Get('parse')
  async parseEmail(
    @Query(ValidationPipe) query: EmailParseRequestDto,
  ): Promise<ParsedEmailDto> {
    const absolutePath = path.resolve(query.path);
    return this.parseEmailUseCase.execute(absolutePath);
  }
}
