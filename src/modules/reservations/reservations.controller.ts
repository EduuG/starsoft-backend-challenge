import { Controller, Post, Body } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.createReservation(
      dto.sessionId,
      dto.seatNumbers,
      dto.userId,
    );
  }
}