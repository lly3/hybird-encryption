import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import {
  GetEncryptDataRequestDto,
  GetEncryptDataResponseDto,
} from './dto/get-encrypt-data.dto';
import { CommonResponse } from './dto/common-response.dto';
import {
  GetDecryptDataRequestDto,
  GetDecryptDataResponseDto,
} from './dto/get-decrypt-data.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import {
  getSwaggerErrorExample,
  getSwaggerResponseSchema,
} from './swagger.schema';
import { ErrorCode } from './constant';

@ApiExtraModels(
  CommonResponse,
  GetEncryptDataResponseDto,
  GetDecryptDataResponseDto,
)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiCreatedResponse({
    description: 'Encryption successful',
    schema: getSwaggerResponseSchema(GetEncryptDataResponseDto),
  })
  @ApiBadRequestResponse({
    description: 'Encryption bad request',
    schema: getSwaggerErrorExample(ErrorCode.BAD_REQUEST),
  })
  @ApiInternalServerErrorResponse({
    description: 'Encryption internal server error',
    schema: getSwaggerErrorExample(ErrorCode.INTERNAL_SERVER_ERROR),
  })
  @Post('/get-encrypt-data')
  async getEncryptData(
    @Body() request: GetEncryptDataRequestDto,
  ): Promise<CommonResponse<GetEncryptDataResponseDto>> {
    const response = new CommonResponse<GetEncryptDataResponseDto>();

    const data = await this.appService.getEncryptData(request);
    response.setSuccess(data);

    return response;
  }

  @ApiCreatedResponse({
    description: 'Decryption successful',
    schema: getSwaggerResponseSchema(GetDecryptDataResponseDto),
  })
  @ApiBadRequestResponse({
    description: 'Decryption bad request',
    schema: getSwaggerErrorExample(ErrorCode.BAD_REQUEST),
  })
  @ApiInternalServerErrorResponse({
    description: 'Decryption internal server error',
    schema: getSwaggerErrorExample(ErrorCode.INTERNAL_SERVER_ERROR),
  })
  @Post('/get-decrypt-data')
  getDecryptData(
    @Body() request: GetDecryptDataRequestDto,
  ): CommonResponse<GetDecryptDataResponseDto> {
    const response = new CommonResponse<GetDecryptDataResponseDto>();

    const data = this.appService.getDecryptData(request);
    response.setSuccess(data);

    return response;
  }
}
