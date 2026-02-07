import { Controller, Post, Body, Headers, ConflictException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateReservationDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cachedResult = await this.reservationsService.checkIdempotency(idempotencyKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const result = await this.reservationsService.createReservation(
      dto.sessionId,
      dto.seatNumbers,
      dto.userId,
    );

    if (idempotencyKey) {
      await this.reservationsService.storeIdempotency(idempotencyKey, result);
    }

    return result;
  }
}