import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CommonResponse } from './dto/common-response.dto';
import { instanceToPlain } from 'class-transformer';

@Catch()
export class GeneralExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, responseBody } = this.createResponse(exception);

    response.status(status).json(instanceToPlain(responseBody));
  }

  private createResponse<T>(exception: unknown): {
    status: number;
    responseBody: CommonResponse<T>;
  } {
    const commonResponse = new CommonResponse<T>();

    if (exception instanceof BadRequestException) {
      Logger.error('Bad Request: ' + this.extractBadRequestMessage(exception));

      commonResponse.setBadRequest();
      return { status: HttpStatus.BAD_REQUEST, responseBody: commonResponse };
    }

    Logger.error('Internal Server Error: ' + exception);
    commonResponse.setError();
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      responseBody: commonResponse,
    };
  }

  private extractBadRequestMessage(exception: BadRequestException): string {
    const res = exception.getResponse() as any;

    const message = Array.isArray(res?.message)
      ? res.message.join(', ')
      : res?.message || 'Bad request';

    return message;
  }
}
