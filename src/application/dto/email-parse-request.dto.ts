import { IsNotEmpty, IsString } from 'class-validator';

export class EmailParseRequestDto {
  @IsNotEmpty()
  @IsString()
  path: string;
}
