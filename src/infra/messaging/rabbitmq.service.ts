import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

/**
 * RabbitMQService
 * 
 * Serviço responsável pela comunicação assíncrona via RabbitMQ.
 * Publica eventos que serão consumidos por listeners/consumers.
 * 
 * Exemplo de uso:
 *   this.rabbit.publish('reservation.created', { reservationId: '123' });
 */
@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(
    @Inject('TICKET_SERVICE') private readonly client: ClientProxy,
  ) {}

  /**
   * Publica um evento no RabbitMQ
   * @param pattern - Nome do evento (ex: 'reservation.created')
   * @param data - Dados do evento
   */
  async publish(pattern: string, data: any): Promise<void> {
    try {
      this.logger.debug(`Publishing event: ${pattern}`, data);
      await this.client.emit(pattern, data);
    } catch (error) {
      this.logger.error(`Failed to publish event ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Alias para publish (mantém compatibilidade com emitEvent)
   */
  async emitEvent(pattern: string, data: any): Promise<void> {
    return this.publish(pattern, data);
  }
}