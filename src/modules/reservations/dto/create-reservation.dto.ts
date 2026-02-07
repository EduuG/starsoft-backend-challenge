import { ArrayMinSize, IsArray, IsInt, IsString, IsUUID, Min } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ example: 'a3bb189e-8bf9-4c21-ae5d-4a9e5b9c7c1a' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  seatNumbers: number[];

  @ApiProperty({ example: 'user-123' })
  @IsString()
  userId: string;
}