import { getSchemaPath } from '@nestjs/swagger';
import { CommonResponse } from './dto/common-response.dto';
import { ErrorCode } from './constant';

export function getSwaggerResponseSchema<T>(model: Function) {
  return {
    allOf: [
      { $ref: getSchemaPath(CommonResponse) },
      {
        properties: {
          data: { $ref: getSchemaPath(model) },
        },
      },
    ],
  };
}

export function getSwaggerErrorExample(
  code: ErrorCode.BAD_REQUEST | ErrorCode.INTERNAL_SERVER_ERROR,
) {
  return {
    allOf: [
      { $ref: getSchemaPath(CommonResponse) },
      {
        properties: {
          data: {
            type: 'object',
            nullable: true,
          },
        },
        example: {
          successful: false,
          error_code: code,
          data: null,
        },
      },
    ],
  };
}
