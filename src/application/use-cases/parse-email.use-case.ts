import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { IEmailParserRepository } from '../../domain/interfaces/email-parser.interface';
import { ParsedEmailDto } from '../dto/parsed-email.dto';

@Injectable()
export class ParseEmailUseCase {
  private readonly logger = new Logger(ParseEmailUseCase.name);

  constructor(private readonly emailParserRepository: IEmailParserRepository) {}

  async execute(filePath: string): Promise<ParsedEmailDto> {
    try {
      this.logger.log(`Parsing email from path: ${filePath}`);
      const parsedEmail = await this.emailParserRepository.parseEmail(filePath);
      
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
