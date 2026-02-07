import { IsInt, IsNotEmpty, IsString, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ example: 'Inception' })
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @ApiProperty({ example: '2024-12-20T19:00:00Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: 'Sala 1' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 20, minimum: 16 })
  @IsInt()
  @Min(16)
  seatCount: number;

  @ApiProperty({ example: 25.0, minimum: 1 })
  @IsInt()
  @Min(1)
  price: number;
}