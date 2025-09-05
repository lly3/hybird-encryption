import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  GetEncryptDataRequestDto,
  GetEncryptDataResponseDto,
} from './dto/get-encrypt-data.dto';
import {
  GetDecryptDataRequestDto,
  GetDecryptDataResponseDto,
} from './dto/get-decrypt-data.dto';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEncryptData', () => {
    it('should success', async () => {
      const request = new GetEncryptDataRequestDto('payload');

      const mockGetEncryptDataReturnValue = new GetEncryptDataResponseDto(
        'data1',
        'data2',
      );
      jest
        .spyOn(appService, 'getEncryptData')
        .mockResolvedValue(mockGetEncryptDataReturnValue);

      const result = await appController.getEncryptData(request);

      expect(result).toMatchObject({
        successful: true,
        errorCode: '2000',
        data: {
          data1: 'data1',
          data2: 'data2',
        },
      });
    });

    it('should throw error when service throws', async () => {
      const request = new GetEncryptDataRequestDto('payload');

      jest
        .spyOn(appService, 'getEncryptData')
        .mockRejectedValue(new Error('Service failed'));

      await expect(appController.getEncryptData(request)).rejects.toThrow(
        'Service failed',
      );
    });
  });

  describe('getDecryptData', () => {
    it('should success', () => {
      const request = new GetDecryptDataRequestDto('data1', 'data2');

      const mockGetDecryptDataReturnValue = new GetDecryptDataResponseDto(
        'payload',
      );
      jest
        .spyOn(appService, 'getDecryptData')
        .mockReturnValue(mockGetDecryptDataReturnValue);

      const result = appController.getDecryptData(request);

      expect(result).toEqual({
        successful: true,
        errorCode: '2000',
        data: {
          payload: 'payload',
        },
      });
    });

    it('should throw error when service throws', () => {
      const request = new GetDecryptDataRequestDto('data1', 'data2');

      jest.spyOn(appService, 'getDecryptData').mockImplementation(() => {
        throw new Error('Service failed');
      });

      expect(() => appController.getDecryptData(request)).toThrow(
        'Service failed',
      );
    });
  });
});
