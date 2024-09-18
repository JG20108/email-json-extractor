import { ParsedEmail } from '../entities/parsed-email.entity';

export interface IEmailParserRepository {
  parseEmail(filePath: string): Promise<ParsedEmail>;
}

export interface IFileSystem {
  readFile(path: string): Promise<Buffer>;
}

export interface IHttpClient {
  get(url: string): Promise<any>;
}
