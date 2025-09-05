import { Injectable } from '@nestjs/common';
import {
  GetEncryptDataRequestDto,
  GetEncryptDataResponseDto,
} from './dto/get-encrypt-data.dto';
import {
  createCipheriv,
  createDecipheriv,
  privateEncrypt,
  publicDecrypt,
  randomBytes,
} from 'crypto';
import {
  GetDecryptDataRequestDto,
  GetDecryptDataResponseDto,
} from './dto/get-decrypt-data.dto';

@Injectable()
export class AppService {
  async getEncryptData(
    request: GetEncryptDataRequestDto,
  ): Promise<GetEncryptDataResponseDto> {
    const iv = randomBytes(16);

    // The key length for aes-256-gcm is 32 byte
    const key = randomBytes(32);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encryptedPayload = Buffer.concat([
      cipher.update(request.payload),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    if (!process.env.RSA_PRIVATE_KEY) {
      throw new Error('rsa private key is not valid');
    }

    const data1 = privateEncrypt(process.env.RSA_PRIVATE_KEY, key).toString(
      'base64',
    );

    const data2 =
      encryptedPayload.toString('base64') +
      ':' +
      iv.toString('base64') +
      ':' +
      tag.toString('base64');

    return new GetEncryptDataResponseDto(data1, data2);
  }

  getDecryptData(request: GetDecryptDataRequestDto): GetDecryptDataResponseDto {
    if (!process.env.RSA_PUBLIC_KEY) {
      throw new Error('rsa public key is not valid');
    }

    const data1Bytes = Buffer.from(request.data1, 'base64');
    const keyBytes = publicDecrypt(process.env.RSA_PUBLIC_KEY, data1Bytes);

    const [encryptedPayload, iv, tag] = request.data2.split(':');
    const encryptedBytes = Buffer.from(encryptedPayload, 'base64');
    const ivBytes = Buffer.from(iv, 'base64');
    const tagBytes = Buffer.from(tag, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', keyBytes, ivBytes);
    decipher.setAuthTag(tagBytes);

    const payload = Buffer.concat([
      decipher.update(encryptedBytes),
      decipher.final(),
    ]).toString('utf-8');

    return new GetDecryptDataResponseDto(payload);
  }
}
