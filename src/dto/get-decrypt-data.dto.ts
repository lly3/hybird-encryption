import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetDecryptDataRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  public data1: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true })
  public data2: string;

  constructor(data1: string, data2: string) {
    this.data1 = data1;
    this.data2 = data2;
  }
}

export class GetDecryptDataResponseDto {
  @ApiProperty()
  public payload: string;

  constructor(payload: string) {
    this.payload = payload;
  }
}
