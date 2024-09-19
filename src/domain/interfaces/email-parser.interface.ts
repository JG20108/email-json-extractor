import { ParsedEmail } from '../entities/parsed-email.entity';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface IEmailParserRepository {
  parseEmail(filePath: string): Promise<ParsedEmail>;
}

export interface IFileSystem {
  readFile(path: string): Promise<Buffer>;
}

export interface IHttpClient {
  get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>;
}
