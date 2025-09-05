import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { GetEncryptDataRequestDto } from './dto/get-encrypt-data.dto';
import { generateKeyPairSync, randomBytes } from 'crypto';
import { GetDecryptDataRequestDto } from './dto/get-decrypt-data.dto';

// Generate RSA key pair for testing
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 1024,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

describe('AppService', () => {
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    // Set environment variables
    process.env.RSA_PRIVATE_KEY = privateKey;
    process.env.RSA_PUBLIC_KEY = publicKey;

    appService = app.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEncryptData', () => {
    it('should success', async () => {
      const request = new GetEncryptDataRequestDto('payload');

      const result = await appService.getEncryptData(request);

      expect(result);
    });

    it('should throw error when private key is not valid', async () => {
      delete process.env.RSA_PRIVATE_KEY;
      const request = new GetEncryptDataRequestDto('payload');

      expect(appService.getEncryptData(request)).rejects.toThrow(
        Error('rsa private key is not valid'),
      );
    });
  });

  describe('getDecryptData', () => {
    it('should success', async () => {
      const requestEncrypt = new GetEncryptDataRequestDto('payload');

      const resultEncrypt = await appService.getEncryptData(requestEncrypt);

      const request = new GetDecryptDataRequestDto(
        resultEncrypt.data1,
        resultEncrypt.data2,
      );

      const result = appService.getDecryptData(request);

      expect(result);
    });

    it('should throw error when public key is not valid', () => {
      delete process.env.RSA_PUBLIC_KEY;
      const request = new GetDecryptDataRequestDto('data1', 'data2');

      expect(() => appService.getDecryptData(request)).toThrow(
        Error('rsa public key is not valid'),
      );
    });
  });
});
