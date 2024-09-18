import { Module } from '@nestjs/common';
import { EmailParserController } from './presentation/controllers/email-parser.controller';
import { ParseEmailUseCase } from './application/use-cases/parse-email.use-case';
import { EmailParserRepository } from './infraestructure/repositories/email-parser.repository';
import { FileSystemAdapter } from './infraestructure/adapters/file-system.adapter';
import { HttpClientAdapter } from './infraestructure/adapters/http-client.adapter';

@Module({
  controllers: [EmailParserController],
  providers: [
    ParseEmailUseCase,
    {
      provide: 'IEmailParserRepository',
      useClass: EmailParserRepository,
    },
    {
      provide: 'IFileSystem',
      useClass: FileSystemAdapter,
    },
    {
      provide: 'IHttpClient',
      useClass: HttpClientAdapter,
    },
  ],
})
export class EmailParserModule {}
