import { Test, TestingModule } from '@nestjs/testing';
import { ParseEmailUseCase } from '../parse-email.use-case';
import { IEmailParserRepository } from '../../../domain/interfaces/email-parser.interface';
import { EMAIL_PARSER_REPOSITORY } from '../../../domain/constants';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ParseEmailUseCase', () => {
  let useCase: ParseEmailUseCase;
  let repository: IEmailParserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParseEmailUseCase,
        {
          provide: EMAIL_PARSER_REPOSITORY,
          useValue: {
            parseEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ParseEmailUseCase>(ParseEmailUseCase);
    repository = module.get<IEmailParserRepository>(EMAIL_PARSER_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return JSON content when found', async () => {
      const mockResult = { jsonContent: { test: 'data' } };
      (repository.parseEmail as jest.Mock).mockResolvedValue(mockResult);

      const result = await useCase.execute('test.eml');
      expect(result).toEqual(mockResult);
    });

    it('should throw HttpException when no JSON is found', async () => {
      (repository.parseEmail as jest.Mock).mockResolvedValue({
        jsonContent: null,
      });

      await expect(useCase.execute('test.eml')).rejects.toThrow(
        new HttpException('No JSON found in email', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw HttpException on error (expected test error)', async () => {
      const expectedErrorMessage =
        'Expected test error: simulating email parsing failure';
      (repository.parseEmail as jest.Mock).mockRejectedValue(
        new Error(expectedErrorMessage),
      );

      await expect(useCase.execute('test.eml')).rejects.toThrow(
        new HttpException(
          expectedErrorMessage,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
