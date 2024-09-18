import { Test, TestingModule } from '@nestjs/testing';
import { EmailParserController } from './email-parser.controller';
import { EmailParserService } from './email-parser.service';

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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('parseEmail', () => {
    it('should call service.parseEmailAndExtractJson with correct path', async () => {
      const mockPath = 'test.eml';
      const mockResult = { jsonContent: { test: 'data' } };
      (service.parseEmailAndExtractJson as jest.Mock).mockResolvedValue(
        mockResult,
      );

      const result = await controller.parseEmail({ path: mockPath });

      expect(service.parseEmailAndExtractJson).toHaveBeenCalledWith(mockPath);
      expect(result).toEqual(mockResult);
    });
  });
});
