import { Test, TestingModule } from '@nestjs/testing';
import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ErrorCode } from 'src/constant';
import { Reflector } from '@nestjs/core';
import { GeneralExceptionFilter } from 'src/general-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GeneralExceptionFilter());

    await app.init();
  });

  it('/get-encrypt-data (POST): success', async () => {
    const req = { payload: 'payload' };

    const result = await request(app.getHttpServer())
      .post('/get-encrypt-data')
      .send(req)
      .expect(201);

    expect(result.body).toMatchObject({
      successful: true,
      error_code: ErrorCode.SUCCESS,
    });
  });

  describe('/get-encrypt-data (POST): bad request', () => {
    it('empty string', async () => {
      const req = { payload: '' };

      const result = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send(req)
        .expect(400);

      expect(result.body).toMatchObject({
        successful: false,
        error_code: ErrorCode.BAD_REQUEST,
      });
    });

    it('non string', async () => {
      const req = { payload: 1 };

      const result = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send(req)
        .expect(400);

      expect(result.body).toMatchObject({
        successful: false,
        error_code: ErrorCode.BAD_REQUEST,
      });
    });
  });
});
