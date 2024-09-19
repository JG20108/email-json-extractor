import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ParseEmailUseCase } from '../src/application/use-cases/parse-email.use-case';
import * as path from 'path';

describe('EmailParserController (e2e)', () => {
  let app: INestApplication;
  let parseEmailUseCase: ParseEmailUseCase;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    parseEmailUseCase = moduleFixture.get<ParseEmailUseCase>(ParseEmailUseCase);
  });

  it('should parse JSON from attachment', async () => {
    const testFilePath = path.join(__dirname, 'test_attachment.eml');
    const mockResult = { name: 'John Doe', age: 30, city: 'New York' };
    jest
      .spyOn(parseEmailUseCase, 'execute')
      .mockResolvedValue({ jsonContent: mockResult });

    return request(app.getHttpServer())
      .get('/email-parser/parse')
      .query({ path: testFilePath })
      .expect(200)
      .expect({ jsonContent: mockResult });
  });

  it('should parse JSON from body link', async () => {
    const testFilePath = path.join(__dirname, 'test_body_link.eml');
    const mockResult = { login: 'github', id: 9919, type: 'Organization' };
    jest
      .spyOn(parseEmailUseCase, 'execute')
      .mockResolvedValue({ jsonContent: mockResult });

    return request(app.getHttpServer())
      .get('/email-parser/parse')
      .query({ path: testFilePath })
      .expect(200)
      .expect({ jsonContent: mockResult });
  });

  it('should parse JSON from webpage link', async () => {
    const testFilePath = path.join(__dirname, 'test_webpage_link.eml');
    const mockResult = { name: '@vscode/vscode', version: '1.83.0' };
    jest
      .spyOn(parseEmailUseCase, 'execute')
      .mockResolvedValue({ jsonContent: mockResult });

    return request(app.getHttpServer())
      .get('/email-parser/parse')
      .query({ path: testFilePath })
      .expect(200)
      .expect({ jsonContent: mockResult });
  });

  afterAll(async () => {
    await app.close();
  });
});
