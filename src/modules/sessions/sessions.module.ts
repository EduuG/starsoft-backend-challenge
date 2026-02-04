import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { Session } from '../sessions/session.entity';
import { Seat } from '../seats/seat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Seat])],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}