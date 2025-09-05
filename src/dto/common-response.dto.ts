import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ErrorCode } from 'src/constant';

export class CommonResponse<T> {
  @ApiProperty()
  public successful: boolean;

  @Expose({ name: 'error_code' })
  @ApiProperty({ name: 'error_code' })
  public errorCode: string;

  @ApiProperty()
  public data: T | null;

  setSuccess(data: T) {
    this.successful = true;
    this.errorCode = ErrorCode.SUCCESS;
    this.data = data;
  }

  setBadRequest() {
    this.successful = false;
    this.errorCode = ErrorCode.BAD_REQUEST;
    this.data = null;
  }

  setError() {
    this.successful = false;
    this.errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    this.data = null;
  }
}
