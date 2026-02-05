import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Reservation, ReservationStatus } from '../reservation.entity';
import { Seat, SeatStatus } from '../../seats/seat.entity';
import { RabbitMQService } from '../../../infra/messaging/rabbitmq.service';
@Injectable()
export class ReservationExpirationService implements OnModuleInit {
  private readonly logger = new Logger(ReservationExpirationService.name);
  private expirationInterval: NodeJS.Timeout;

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,
    private readonly rabbit: RabbitMQService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting reservation expiration check...');
    this.startExpirationCheck();
  }

  // Runs a periodic check every 10 seconds.
  private startExpirationCheck() {
    this.expirationInterval = setInterval(async () => {
      await this.checkAndExpireReservations();
    }, 10_000);
  }

  // Expires ACTIVE reservations where expiresAt < now.
  private async checkAndExpireReservations() {
    try {
      const now = new Date();

      const expiredReservations = await this.reservationRepo.find({
        where: {
          expiresAt: LessThan(now),
          status: ReservationStatus.ACTIVE,
        },
        relations: ['reservationSeats', 'reservationSeats.seat'],
      });

      if (expiredReservations.length === 0) {
        return;
      }

      this.logger.log(
        `Found ${expiredReservations.length} expired reservations`,
      );

      for (const reservation of expiredReservations) {
        await this.expireReservation(reservation);
      }
    } catch (error) {
      this.logger.error('Error checking expired reservations:', error);
    }
  }

  // Releases seats, publishes events, and removes the reservation.
  private async expireReservation(reservation: Reservation) {
    try {
      const reservationId = reservation.id;
      const seatIds = reservation.reservationSeats.map(rs => rs.seat.id);

      await this.seatRepo.update(seatIds, { status: SeatStatus.AVAILABLE });

      await this.rabbit.publish('reservation.expired', {
        reservationId,
        seats: reservation.reservationSeats.map(rs => rs.seat.number),
      });

      await this.rabbit.publish('seat.released', {
        reservationId,
        seats: reservation.reservationSeats.map(rs => rs.seat.number),
      });

      await this.reservationRepo.remove(reservation);

      this.logger.log(`Expired reservation: ${reservationId}`);
    } catch (error) {
      this.logger.error(
        `Error expiring reservation ${reservation.id}:`,
        error,
      );
    }
  }

  onModuleDestroy() {
    if (this.expirationInterval) {
      clearInterval(this.expirationInterval);
    }
  }
}