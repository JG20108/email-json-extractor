import { Test, TestingModule } from '@nestjs/testing';
import { EmailParserController } from './email-parser.controller';
import { EmailParserService } from './email-parser.service';
import { ParsedEmailDto } from './dto/parsed-email.dto';
import * as path from 'path';

describe('EmailParserController', () => {
  let controller: EmailParserController;
  let service: EmailParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailParserController],
      providers: [
        {
          provide: EmailParserService,
          useValue: {
            parseEmailAndExtractJson: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmailParserController>(EmailParserController);
    service = module.get<EmailParserService>(EmailParserService);
  });

  describe('parseEmail', () => {
    it('should call service.parseEmailAndExtractJson with correct path', async () => {
      const mockPath = path.join('test', 'test.eml');
      const mockResult: ParsedEmailDto = { jsonContent: { test: 'data' } };
      (service.parseEmailAndExtractJson as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.parseEmail({ path: mockPath });

      expect(service.parseEmailAndExtractJson).toHaveBeenCalledWith(expect.stringContaining(mockPath));
      expect(result).toEqual(mockResult);
    });
  });
});
