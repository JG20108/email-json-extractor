import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IHttpClient } from '../../domain/interfaces/email-parser.interface';

@Injectable()
export class HttpClientAdapter implements IHttpClient {
  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return await axios.get<T>(url, config);
  }
}
