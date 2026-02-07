import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({ example: 'a3bb189e-8bf9-4c21-ae5d-4a9e5b9c7c1a' })
  @IsUUID()
  reservationId: string;

  @ApiProperty({ example: 'user-123' })
  @IsString()
  userId: string;
}
