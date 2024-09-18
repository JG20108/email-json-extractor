import { Test, TestingModule } from '@nestjs/testing';
import { EmailParserService } from './email-parser.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock('axios');
jest.mock('mailparser', () => ({
  simpleParser: jest.fn(),
}));

describe('EmailParserService', () => {
  let service: EmailParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailParserService],
    }).compile();

    service = module.get<EmailParserService>(EmailParserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseEmailAndExtractJson', () => {
    it('should extract JSON from attachment', async () => {
      const mockAttachment = {
        filename: 'test.json',
        content: Buffer.from(JSON.stringify({ test: 'data' })),
        contentType: 'application/json',
      };
      const mockEmail = {
        attachments: [mockAttachment],
        text: '',
      };
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        'mock email content',
      );
      (require('mailparser').simpleParser as jest.Mock).mockResolvedValue(
        mockEmail,
      );

      const result = await service.parseEmailAndExtractJson('test.eml');
      expect(result).toEqual({ jsonContent: { test: 'data' } });
    });

    it('should extract JSON from link in email body', async () => {
      const mockEmail = {
        attachments: [],
        text: 'Check this JSON: https://example.com/data.json',
      };
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        'mock email content',
      );
      (require('mailparser').simpleParser as jest.Mock).mockResolvedValue(
        mockEmail,
      );
      (axios.get as jest.Mock).mockResolvedValue({ data: { test: 'data' } });

      const result = await service.parseEmailAndExtractJson('test.eml');
      expect(result).toEqual({ jsonContent: { test: 'data' } });
    });

    it('should throw an error if no JSON is found', async () => {
      const mockEmail = {
        attachments: [],
        text: 'No JSON here',
      };
      (fs.promises.readFile as jest.Mock).mockResolvedValue(
        'mock email content',
      );
      (require('mailparser').simpleParser as jest.Mock).mockResolvedValue(
        mockEmail,
      );

      await expect(
        service.parseEmailAndExtractJson('test.eml'),
      ).rejects.toThrow(
        new HttpException('No JSON found in email', HttpStatus.NOT_FOUND),
      );
    });
  });
});
