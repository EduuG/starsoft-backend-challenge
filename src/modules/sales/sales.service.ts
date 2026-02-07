import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from './sale.entity';
import { Reservation, ReservationStatus } from '../reservations/reservation.entity';
import { Seat, SeatStatus } from '../seats/seat.entity';
import { RabbitMQService } from '../../infra/messaging/rabbitmq.service';
import { RedisService } from '../../infra/redis/redis.service';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,

    private readonly dataSource: DataSource,
    private readonly rabbit: RabbitMQService,
    private readonly redis: RedisService,
  ) {}

  async checkIdempotency(key: string) {
    return this.redis.getIdempotencyResult(key);
  }

  async storeIdempotency(key: string, result: any) {
    await this.redis.storeIdempotencyResult(key, result);
  }

  // Confirms payment and creates a sale.
  async confirmPayment(
    reservationId: string,
    userId: string,
  ): Promise<{
    saleId: string;
    userId: string;
    totalAmount: number;
    seats: number[];
    confirmedAt: Date;
  }> {
    this.logger.log(`Confirming payment for reservation ${reservationId} by user ${userId}`);

    // Load reservation with seats.
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId },
      relations: ['reservationSeats', 'reservationSeats.seat', 'session'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    if (reservation.userId !== userId) {
      throw new ConflictException('Reservation does not belong to this user');
    }

    if (reservation.status !== ReservationStatus.ACTIVE) {
      throw new ConflictException(
        `Reservation is not in ACTIVE status. Current status: ${reservation.status}`,
      );
    }

    if (new Date() > reservation.expiresAt) {
      throw new ConflictException('Reservation has expired');
    }

    const seatNumbers = reservation.reservationSeats.map(rs => rs.seat.number);
    const seatCount = seatNumbers.length;
    const pricePerSeat = reservation.session.price;
    const totalAmount = seatCount * pricePerSeat;
    const seatIds = reservation.reservationSeats.map(rs => rs.seat.id);

    let sale: Sale;

    try {
      sale = await this.dataSource.transaction(async manager => {
        const newSale = manager.create(Sale, {
          userId,
          totalAmount,
          createdAt: new Date(),
          seats: reservation.reservationSeats.map(rs => rs.seat),
        });

        const savedSale = await manager.save(newSale);
        this.logger.log(`Sale created: ${savedSale.id}`);

        await manager.update(
          Seat,
          seatIds,
          { status: SeatStatus.SOLD },
        );

        await manager.update(
          Reservation,
          { id: reservationId },
          { status: ReservationStatus.CONFIRMED },
        );

        this.logger.log(
          `Marked ${seatCount} seats as SOLD and updated reservation status to CONFIRMED`,
        );

        return savedSale;
      });
    } catch (error) {
      this.logger.error(`Error confirming payment: ${error.message}`, error);
      throw error;
    }

    try {
      await this.rabbit.publish('payment.confirmed', {
        saleId: sale.id,
        reservationId,
        userId,
        seats: seatNumbers,
        totalAmount,
        confirmedAt: sale.createdAt,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to publish payment.confirmed event: ${error.message}`,
      );
      // TODO: consider retry mechanism or outbox pattern for event publishing
      // Sale already created; do not fail the request here.
    }

    return {
      saleId: sale.id,
      userId,
      totalAmount,
      seats: seatNumbers,
      confirmedAt: sale.createdAt,
    };
  }

  // User purchase history.
  async getUserPurchaseHistory(userId: string) {
    this.logger.log(`Fetching purchase history for user ${userId}`);

    const sales = await this.saleRepository.find({
      where: { userId },
      relations: ['seats'],
      order: { createdAt: 'DESC' },
    });

    return sales.map(sale => ({
      saleId: sale.id,
      totalAmount: sale.totalAmount,
      seatCount: sale.seats?.length || 0,
      purchasedAt: sale.createdAt,
    }));
  }
}
