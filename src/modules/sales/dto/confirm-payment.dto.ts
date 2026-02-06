import { IsUUID, IsString } from 'class-validator';

export class ConfirmPaymentDto {
  @IsUUID()
  reservationId: string;

  @IsString()
  userId: string;
}
