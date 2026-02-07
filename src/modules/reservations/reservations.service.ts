import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { RabbitMQService } from "../../infra/messaging/rabbitmq.service";
import { RedisService } from "../../infra/redis/redis.service";
import { DataSource, In } from "typeorm";
import { Seat, SeatStatus } from "../seats/seat.entity";
import { Session } from "../sessions/session.entity";
import { Reservation } from "./reservation.entity";
import { ReservationSeat } from "./reservation-seat.entity";

@Injectable()
export class ReservationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
    private readonly rabbit: RabbitMQService,
  ) {}

  async checkIdempotency(key: string) {
    return this.redis.getIdempotencyResult(key);
  }

  async storeIdempotency(key: string, result: any) {
    await this.redis.storeIdempotencyResult(key, result);
  }

async createReservation(sessionId: string, seatNumbers: number[], userId: string) {
  const lockKey = `lock:session:${sessionId}:seats:${seatNumbers.sort().join(',')}`;
  const locked = await this.redis.acquireLock(lockKey, 30_000);

  if (!locked) {
    throw new ConflictException('Assentos em disputa. Tente novamente.');
  }

  let reservationResult;

  try {
    // DB transaction only.
    reservationResult = await this.dataSource.transaction(async manager => {
      const session = await manager.findOne(Session, {
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException('Sessão não encontrada');
      }

      const seats = await manager.find(Seat, {
        where: {
          session: { id: sessionId },
          number: In(seatNumbers),
          status: SeatStatus.AVAILABLE,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (seats.length !== seatNumbers.length) {
        throw new ConflictException('Um ou mais assentos ficaram indisponíveis');
      }

      const expiresAt = new Date(Date.now() + 30_000);
      const reservation = manager.create(Reservation, {
        userId,
        expiresAt,
        session: { id: sessionId } as Session,
      });
      await manager.save(reservation);

      const reservationSeats = seats.map(seat =>
        manager.create(ReservationSeat, { reservation, seat }),
      );
      await manager.save(reservationSeats);

      await manager.update(Seat, seats.map(s => s.id), { status: SeatStatus.RESERVED });

      return { reservationId: reservation.id, expiresAt, userId };
    });

    await this.rabbit.publish('reservation.created', {
      ...reservationResult,
      seats: seatNumbers,
      sessionId,
    });

    return reservationResult;

  } finally {
    // Release the Redis lock to allow new attempts.
    await this.redis.releaseLock(lockKey);
  }
}}