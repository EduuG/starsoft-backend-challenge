import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../sessions/session.entity';
import { Seat, SeatStatus } from '../seats/seat.entity';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async create(dto: CreateSessionDto): Promise<Session> {
    // Prevent duplicate session for same movie/time/room.
    const existingSession = await this.sessionRepository.findOne({
      where: {
        movieTitle: dto.movieTitle,
        startsAt: new Date(dto.startsAt),
        roomId: dto.roomId,
      },
    });

    if (existingSession) {
      throw new ConflictException(
        `Session already exists: "${dto.movieTitle}" at ${dto.startsAt} in ${dto.roomId}`,
      );
    }

    const session = this.sessionRepository.create({
      movieTitle: dto.movieTitle,
      startsAt: new Date(dto.startsAt),
      roomId: dto.roomId,
      price: dto.price,
    });

    await this.sessionRepository.save(session);

    const seats = Array.from({ length: dto.seatCount }).map((_, index) =>
      this.seatRepository.create({
        session,
        number: index + 1,
        status: SeatStatus.AVAILABLE,
      }),
    );

    await this.seatRepository.save(seats);

    return session;
  }

  // List sessions with seat stats.
  async listAll() {
    const sessions = await this.sessionRepository.find({
      order: { startsAt: 'ASC' },
    });

    // Aggregate seat status per session.
    const sessionsWithStats = await Promise.all(
      sessions.map(async session => {
        const seats = await this.seatRepository.find({
          where: { session: { id: session.id } },
        });

        const available = seats.filter(s => s.status === SeatStatus.AVAILABLE).length;
        const reserved = seats.filter(s => s.status === SeatStatus.RESERVED).length;
        const sold = seats.filter(s => s.status === SeatStatus.SOLD).length;

        return {
          id: session.id,
          movieTitle: session.movieTitle,
          startsAt: session.startsAt,
          roomId: session.roomId,
          price: session.price,
          totalSeats: seats.length,
          available,
          reserved,
          sold,
        };
      }),
    );

    return sessionsWithStats;
  }

  // Session details with seat stats.
  async findById(sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const seats = await this.seatRepository.find({
      where: { session: { id: sessionId } },
    });

    const available = seats.filter(s => s.status === SeatStatus.AVAILABLE).length;
    const reserved = seats.filter(s => s.status === SeatStatus.RESERVED).length;
    const sold = seats.filter(s => s.status === SeatStatus.SOLD).length;

    return {
      id: session.id,
      movieTitle: session.movieTitle,
      startsAt: session.startsAt,
      roomId: session.roomId,
      price: session.price,
      totalSeats: seats.length,
      available,
      reserved,
      sold,
    };
  }

  // Seat-level availability by session.
  async getSessionSeats(sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const seats = await this.seatRepository.find({
      where: { session: { id: sessionId } },
      order: { number: 'ASC' },
    });

    const available = seats.filter(s => s.status === SeatStatus.AVAILABLE).length;
    const reserved = seats.filter(s => s.status === SeatStatus.RESERVED).length;
    const sold = seats.filter(s => s.status === SeatStatus.SOLD).length;

    return {
      sessionId,
      movieTitle: session.movieTitle,
      startsAt: session.startsAt,
      roomId: session.roomId,
      price: session.price,
      totalSeats: seats.length,
      available,
      reserved,
      sold,
      seats: seats.map(s => ({
        number: s.number,
        status: s.status,
      })),
    };
  }
}