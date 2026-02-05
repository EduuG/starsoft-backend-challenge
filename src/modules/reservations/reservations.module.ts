import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationExpirationService } from './services/reservation-expiration.service';
import { ReservationEventsListener } from './listeners/reservation-events.listener';
import { Reservation } from './reservation.entity';
import { ReservationSeat } from './reservation-seat.entity';
import { Seat } from '../seats/seat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ReservationSeat, Seat]),
  ],
  controllers: [ReservationsController, ReservationEventsListener],
  providers: [
    ReservationsService,
    ReservationExpirationService, // Serviço de expiração
  ],
  exports: [ReservationsService],
})
export class ReservationsModule {}