import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './infra/database/typeorm.config';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { MessagingModule } from './infra/messaging/messaging.module';
import { RedisModule } from './infra/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    RedisModule,
    MessagingModule,
    SessionsModule,
    ReservationsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}