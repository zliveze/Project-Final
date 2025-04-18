import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ConcernsResponseDto {
  @ApiProperty({
    description: 'List of unique skin concerns found in products',
    type: [String],
    example: ['Mụn', 'Lão hóa', 'Thâm nám', 'Da không đều màu'],
  })
  @IsArray()
  @IsString({ each: true })
  concerns: string[];
}
