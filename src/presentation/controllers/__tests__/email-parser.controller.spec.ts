import { Test, TestingModule } from '@nestjs/testing';
import { EmailParserController } from '../email-parser.controller';
import { ParseEmailUseCase } from '../../../application/use-cases/parse-email.use-case';
import { ParsedEmailDto } from '../../../application/dto/parsed-email.dto';
import * as path from 'path';

describe('EmailParserController', () => {
  let controller: EmailParserController;
  let parseEmailUseCase: ParseEmailUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailParserController],
      providers: [
        {
          provide: ParseEmailUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmailParserController>(EmailParserController);
    parseEmailUseCase = module.get<ParseEmailUseCase>(ParseEmailUseCase);
  });

  describe('parseEmail', () => {
    it('should call parseEmailUseCase.execute with correct path', async () => {
      const mockPath = 'test/test.eml';
      const mockResult: ParsedEmailDto = { jsonContent: { test: 'data' } };
      (parseEmailUseCase.execute as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.parseEmail({ path: mockPath });

      expect(parseEmailUseCase.execute).toHaveBeenCalledWith(expect.stringMatching(/test[/\\]test\.eml$/));
      expect(result).toEqual(mockResult);
    });
  });
});
