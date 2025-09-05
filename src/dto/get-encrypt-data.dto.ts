import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class GetEncryptDataRequestDto {
  @IsString()
  @IsNotEmpty()
  @Length(0, 2000)
  @ApiProperty({ required: true, minLength: 0, maxLength: 2000 })
  public payload: string;

  constructor(payload: string) {
    this.payload = payload;
  }
}

export class GetEncryptDataResponseDto {
  @ApiProperty()
  public data1: string;
  @ApiProperty()
  public data2: string;

  constructor(data1: string, data2: string) {
    this.data1 = data1;
    this.data2 = data2;
  }
}
