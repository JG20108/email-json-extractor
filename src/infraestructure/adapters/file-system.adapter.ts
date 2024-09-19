import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { IFileSystem } from '../../domain/interfaces/email-parser.interface';

@Injectable()
export class FileSystemAdapter implements IFileSystem {
  async readFile(path: string): Promise<Buffer> {
    return fs.readFile(path);
  }
}
