import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './sale.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Reservation } from '../reservations/reservation.entity';
import { Seat } from '../seats/seat.entity';
import { Session } from '../sessions/session.entity';
import { MessagingModule } from '../../infra/messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, Reservation, Seat, Session]),
    MessagingModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
