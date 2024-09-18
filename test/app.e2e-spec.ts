import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { EmailParserService } from '../src/email-parser/email-parser.service';

describe('EmailParserController (e2e)', () => {
  let app: INestApplication;
  let emailParserService: EmailParserService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    emailParserService = moduleFixture.get<EmailParserService>(EmailParserService);
  });

  it('/email-parser/parse (GET)', () => {
    const mockResult = { jsonContent: { test: 'data' } };
    jest.spyOn(emailParserService, 'parseEmailAndExtractJson').mockResolvedValue(mockResult);

    return request(app.getHttpServer())
      .get('/email-parser/parse')
      .query({ path: 'test.eml' })
      .expect(200)
      .expect(mockResult);
  });

  afterAll(async () => {
    await app.close();
  });
});
