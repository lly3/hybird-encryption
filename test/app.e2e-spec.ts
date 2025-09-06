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
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GeneralExceptionFilter } from 'src/general-exception.filter';

describe('Hybrid Encryption API (e2e)', () => {
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
        
    // Setup swagger
    const config = new DocumentBuilder()
        .setTitle('Hybrid Encryption')
        .setDescription('The API description of hybrid encryption')
        .setVersion('1.0')
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, documentFactory);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api-docs', () => {
    it('should serve Swagger documentation', async () => {
      await request(app.getHttpServer())
        .get('/api-docs')
        .expect(200);
    });
  });

  describe('POST /get-encrypt-data', () => {
    it('should encrypt simple text payload successfully', async () => {
      const req = { payload: 'Hello World!' };

      const result = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send(req)
        .expect(201);

      expect(result.body).toMatchObject({
        successful: true,
        error_code: ErrorCode.SUCCESS,
        data: expect.objectContaining({
          data1: expect.any(String),
          data2: expect.any(String),
        }),
      });

      // Validate data1 (encrypted AES key) is base64
      expect(() => Buffer.from(result.body.data.data1, 'base64')).not.toThrow();
      
      // Validate data2 format (encryptedPayload:iv:tag)
      const data2Parts = result.body.data.data2.split(':');
      expect(data2Parts).toHaveLength(3);
      data2Parts.forEach(part => {
        expect(() => Buffer.from(part, 'base64')).not.toThrow();
      });
    });

    it('should encrypt JSON payload successfully', async () => {
      const jsonPayload = JSON.stringify({ user: 'test', data: [1, 2, 3] });
      const req = { payload: jsonPayload };

      const result = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send(req)
        .expect(201);

      expect(result.body.successful).toBe(true);
      expect(result.body.data.data1).toBeDefined();
      expect(result.body.data.data2).toBeDefined();
    });

    it('should encrypt maximum length payload (2000 chars)', async () => {
      const longPayload = 'a'.repeat(2000);
      const req = { payload: longPayload };

      const result = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send(req)
        .expect(201);

      expect(result.body.successful).toBe(true);
    });

    it('should encrypt unicode characters correctly', async () => {
      const req = { payload: '🔐 Encrypted text with émojis and ñ characters!' };

      const result = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send(req)
        .expect(201);

      expect(result.body.successful).toBe(true);
    });

    it('should generate different encrypted data for same payload (non-deterministic)', async () => {
      const req = { payload: 'test payload' };

      const result1 = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send(req)
        .expect(201);

      const result2 = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send(req)
        .expect(201);

      // Should have different encrypted data due to random IV and AES key
      expect(result1.body.data.data1).not.toBe(result2.body.data.data1);
      expect(result1.body.data.data2).not.toBe(result2.body.data.data2);
    });

    describe('validation errors', () => {
      it('should reject empty payload', async () => {
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

      it('should reject non-string payload', async () => {
        const req = { payload: 123 };

        const result = await request(app.getHttpServer())
          .post('/get-encrypt-data')
          .send(req)
          .expect(400);

        expect(result.body).toMatchObject({
          successful: false,
          error_code: ErrorCode.BAD_REQUEST,
        });
      });

      it('should reject payload over 2000 characters', async () => {
        const req = { payload: 'a'.repeat(2001) };

        const result = await request(app.getHttpServer())
          .post('/get-encrypt-data')
          .send(req)
          .expect(400);

        expect(result.body).toMatchObject({
          successful: false,
          error_code: ErrorCode.BAD_REQUEST,
        });
      });

      it('should reject missing payload field', async () => {
        const req = {};

        const result = await request(app.getHttpServer())
          .post('/get-encrypt-data')
          .send(req)
          .expect(400);

        expect(result.body).toMatchObject({
          successful: false,
          error_code: ErrorCode.BAD_REQUEST,
        });
      });

      it('should reject extra fields', async () => {
        const req = { payload: 'test', extraField: 'should be rejected' };

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

  describe('POST /get-decrypt-data', () => {
    it('should decrypt previously encrypted data successfully', async () => {
      const originalPayload = 'Test decryption message!';
      
      // First encrypt the data
      const encryptResult = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send({ payload: originalPayload })
        .expect(201);

      const { data1, data2 } = encryptResult.body.data;

      // Then decrypt it
      const decryptResult = await request(app.getHttpServer())
        .post('/get-decrypt-data')
        .send({ data1, data2 })
        .expect(201);

      expect(decryptResult.body).toMatchObject({
        successful: true,
        error_code: ErrorCode.SUCCESS,
        data: {
          payload: originalPayload,
        },
      });
    });

    it('should decrypt JSON payload correctly', async () => {
      const jsonPayload = JSON.stringify({ message: 'test', numbers: [1, 2, 3] });
      
      const encryptResult = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send({ payload: jsonPayload })
        .expect(201);

      const { data1, data2 } = encryptResult.body.data;

      const decryptResult = await request(app.getHttpServer())
        .post('/get-decrypt-data')
        .send({ data1, data2 })
        .expect(201);

      expect(decryptResult.body.data.payload).toBe(jsonPayload);
      expect(JSON.parse(decryptResult.body.data.payload)).toEqual({
        message: 'test',
        numbers: [1, 2, 3],
      });
    });

    it('should decrypt unicode characters correctly', async () => {
      const unicodePayload = '🔐 Test with émojis and ñ special chars! 你好';
      
      const encryptResult = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send({ payload: unicodePayload })
        .expect(201);

      const { data1, data2 } = encryptResult.body.data;

      const decryptResult = await request(app.getHttpServer())
        .post('/get-decrypt-data')
        .send({ data1, data2 })
        .expect(201);

      expect(decryptResult.body.data.payload).toBe(unicodePayload);
    });

    it('should decrypt maximum length payload', async () => {
      const longPayload = 'x'.repeat(2000);
      
      const encryptResult = await request(app.getHttpServer())
        .post('/get-encrypt-data')
        .send({ payload: longPayload })
        .expect(201);

      const { data1, data2 } = encryptResult.body.data;

      const decryptResult = await request(app.getHttpServer())
        .post('/get-decrypt-data')
        .send({ data1, data2 })
        .expect(201);

      expect(decryptResult.body.data.payload).toBe(longPayload);
    });

    describe('validation errors', () => {
      it('should reject invalid base64 data1', async () => {
        const req = { data1: 'invalid-base64!@#', data2: 'valid:base64:data' };

        const result = await request(app.getHttpServer())
          .post('/get-decrypt-data')
          .send(req)
          .expect(500);

        expect(result.body).toMatchObject({
          successful: false,
          error_code: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      });

      it('should reject malformed data2 format', async () => {
        // Get valid data1 first
        const encryptResult = await request(app.getHttpServer())
          .post('/get-encrypt-data')
          .send({ payload: 'test' })
          .expect(201);

        const { data1 } = encryptResult.body.data;
        const req = { data1, data2: 'malformed-data2-missing-colons' };

        const result = await request(app.getHttpServer())
          .post('/get-decrypt-data')
          .send(req)
          .expect(500);

        expect(result.body).toMatchObject({
          successful: false,
          error_code: ErrorCode.INTERNAL_SERVER_ERROR,
        });
      });

      it('should reject missing data1 field', async () => {
        const req = { data2: 'valid:base64:data' };

        const result = await request(app.getHttpServer())
          .post('/get-decrypt-data')
          .send(req)
          .expect(400);

        expect(result.body).toMatchObject({
          successful: false,
          error_code: ErrorCode.BAD_REQUEST,
        });
      });

      it('should reject missing data2 field', async () => {
        const req = { data1: 'dGVzdA==' };

        const result = await request(app.getHttpServer())
          .post('/get-decrypt-data')
          .send(req)
          .expect(400);

        expect(result.body).toMatchObject({
          successful: false,
          error_code: ErrorCode.BAD_REQUEST,
        });
      });

      it('should reject empty string fields', async () => {
        const req = { data1: '', data2: '' };

        const result = await request(app.getHttpServer())
          .post('/get-decrypt-data')
          .send(req)
          .expect(400);

        expect(result.body).toMatchObject({
          successful: false,
          error_code: ErrorCode.BAD_REQUEST,
        });
      });

      it('should reject non-string fields', async () => {
        const req = { data1: 123, data2: 456 };

        const result = await request(app.getHttpServer())
          .post('/get-decrypt-data')
          .send(req)
          .expect(400);

        expect(result.body).toMatchObject({
          successful: false,
          error_code: ErrorCode.BAD_REQUEST,
        });
      });
    });

    describe('cryptographic integrity', () => {
      it('should fail to decrypt with tampered data1', async () => {
        const encryptResult = await request(app.getHttpServer())
          .post('/get-encrypt-data')
          .send({ payload: 'test' })
          .expect(201);

        const { data1, data2 } = encryptResult.body.data;
        
        // Tamper with data1
        const tamperedData1 = Buffer.from(data1, 'base64');
        tamperedData1[0] ^= 1; // Flip one bit
        const tamperedData1Base64 = tamperedData1.toString('base64');

        const result = await request(app.getHttpServer())
          .post('/get-decrypt-data')
          .send({ data1: tamperedData1Base64, data2 })
          .expect(500);

        expect(result.body.successful).toBe(false);
      });

      it('should fail to decrypt with tampered data2 (auth tag verification)', async () => {
        const encryptResult = await request(app.getHttpServer())
          .post('/get-encrypt-data')
          .send({ payload: 'test' })
          .expect(201);

        const { data1, data2 } = encryptResult.body.data;
        const [encryptedPayload, iv, tag] = data2.split(':');
        
        // Tamper with encrypted payload
        const tamperedPayload = Buffer.from(encryptedPayload, 'base64');
        if (tamperedPayload.length > 0) {
          tamperedPayload[0] ^= 1; // Flip one bit
        }
        const tamperedData2 = `${tamperedPayload.toString('base64')}:${iv}:${tag}`;

        const result = await request(app.getHttpServer())
          .post('/get-decrypt-data')
          .send({ data1, data2: tamperedData2 })
          .expect(500);

        expect(result.body.successful).toBe(false);
      });
    });
  });

  describe('Full encryption/decryption workflow', () => {
    const testCases = [
      { name: 'simple text', payload: 'Hello, World!' },
      { name: 'JSON object', payload: JSON.stringify({ key: 'value', nested: { array: [1, 2, 3] } }) },
      { name: 'empty JSON', payload: '{}' },
      { name: 'numbers as string', payload: '12345.67890' },
      { name: 'special characters', payload: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
      { name: 'multiline text', payload: 'Line 1\nLine 2\nLine 3' },
      { name: 'unicode and emojis', payload: '🚀 Unicode test: äöü ñ 中文 🔐' },
    ];

    testCases.forEach(({ name, payload }) => {
      it(`should handle ${name} end-to-end`, async () => {
        // Encrypt
        const encryptResult = await request(app.getHttpServer())
          .post('/get-encrypt-data')
          .send({ payload })
          .expect(201);

        expect(encryptResult.body.successful).toBe(true);
        expect(encryptResult.body.data.data1).toBeDefined();
        expect(encryptResult.body.data.data2).toBeDefined();

        // Decrypt
        const { data1, data2 } = encryptResult.body.data;
        const decryptResult = await request(app.getHttpServer())
          .post('/get-decrypt-data')
          .send({ data1, data2 })
          .expect(201);

        expect(decryptResult.body.successful).toBe(true);
        expect(decryptResult.body.data.payload).toBe(payload);
      });
    });
  });
});
