import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import {
  IEmailParserRepository,
  EMAIL_PARSER_REPOSITORY,
} from '../../domain/interfaces/email-parser.interface';
import { ParsedEmailDto } from '../dto/parsed-email.dto';
import * as path from 'path';

@Injectable()
export class ParseEmailUseCase {
  private readonly logger = new Logger(ParseEmailUseCase.name);

  constructor(
    @Inject(EMAIL_PARSER_REPOSITORY)
    private readonly emailParserRepository: IEmailParserRepository,
  ) {}

  async execute(filePath: string): Promise<ParsedEmailDto> {
    try {
      this.logger.log(`Parsing email from path: ${filePath}`);
      const absolutePath = path.resolve(process.cwd(), filePath);
      this.logger.log(`Absolute path: ${absolutePath}`);
      const parsedEmail =
        await this.emailParserRepository.parseEmail(absolutePath);

      if (parsedEmail.jsonContent) {
        return { jsonContent: parsedEmail.jsonContent };
      }

      this.logger.warn('No JSON found in email');
      throw new HttpException('No JSON found in email', HttpStatus.NOT_FOUND);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error parsing email: ${error.message}`);
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
