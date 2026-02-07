import { Controller, Post, Body, Headers, ConflictException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@ApiTags('reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservationsService: ReservationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Reservar assentos', description: 'Cria uma reserva temporária de assentos (válida por 30 segundos)' })
  @ApiHeader({ name: 'idempotency-key', required: false, description: 'Chave única para idempotência (ex: UUID). Mesma chave retorna resultado cacheado, chave diferente cria nova reserva. Cache válido por 24h.' })
  @ApiResponse({ status: 201, description: 'Reserva criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Assentos já reservados ou em disputa' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async create(
    @Body() dto: CreateReservationDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const cachedResult = await this.reservationsService.checkIdempotency(idempotencyKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const result = await this.reservationsService.createReservation(
      dto.sessionId,
      dto.seatNumbers,
      dto.userId,
    );

    if (idempotencyKey) {
      await this.reservationsService.storeIdempotency(idempotencyKey, result);
    }

    return result;
  }
}