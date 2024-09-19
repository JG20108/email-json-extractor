import { Module } from '@nestjs/common';
import { EmailParserController } from './presentation/controllers/email-parser.controller';
import { ParseEmailUseCase } from './application/use-cases/parse-email.use-case';
import { EmailParserRepository } from './infraestructure/repositories/email-parser.repository';
import { FileSystemAdapter } from './infraestructure/adapters/file-system.adapter';
import { HttpClientAdapter } from './infraestructure/adapters/http-client.adapter';
import {
  EMAIL_PARSER_REPOSITORY,
  FILE_SYSTEM,
  HTTP_CLIENT,
} from './domain/interfaces/email-parser.interface';

@Module({
  controllers: [EmailParserController],
  providers: [
    ParseEmailUseCase,
    {
      provide: EMAIL_PARSER_REPOSITORY,
      useClass: EmailParserRepository,
    },
    {
      provide: FILE_SYSTEM,
      useClass: FileSystemAdapter,
    },
    {
      provide: HTTP_CLIENT,
      useClass: HttpClientAdapter,
    },
  ],
})
export class EmailParserModule {}
