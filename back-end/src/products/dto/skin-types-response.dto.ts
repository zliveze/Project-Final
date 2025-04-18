import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SkinTypesResponseDto {
  @ApiProperty({
    description: 'List of unique skin types found in products',
    type: [String],
    example: ['Da dầu', 'Da khô', 'Da hỗn hợp', 'Da nhạy cảm'],
  })
  @IsArray()
  @IsString({ each: true })
  skinTypes: string[];
}
