import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * RedisModule
 * 
 * Módulo global que fornece o RedisService para toda a aplicação.
 * Responsável por gerenciar a conexão com Redis e locks distribuídos.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}