import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { IHttpClient } from '../../domain/interfaces/email-parser.interface';

@Injectable()
export class HttpClientAdapter implements IHttpClient {
  async get(url: string): Promise<any> {
    const response = await axios.get(url);
    return response.data;
  }
}
