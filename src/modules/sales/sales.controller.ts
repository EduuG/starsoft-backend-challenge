import { Controller, Post, Body, Get, Param, BadRequestException, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('confirm-payment')
  @ApiOperation({ summary: 'Confirmar pagamento', description: 'Confirma o pagamento e converte a reserva em venda definitiva' })
  @ApiHeader({ name: 'idempotency-key', required: false, description: 'Chave única para idempotência (ex: UUID). Mesma chave retorna resultado cacheado, chave diferente processa novo pagamento. Cache válido por 24h.' })
  @ApiResponse({ status: 201, description: 'Pagamento confirmado e venda criada' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada ou expirada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async confirmPayment(
    @Body() dto: ConfirmPaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    if (!dto.reservationId || !dto.userId) {
      throw new BadRequestException('reservationId and userId are required');
    }

    if (idempotencyKey) {
      const cachedResult = await this.salesService.checkIdempotency(idempotencyKey);
      if (cachedResult) {
        return cachedResult;
      }
    }

    const result = await this.salesService.confirmPayment(dto.reservationId, dto.userId);

    if (idempotencyKey) {
      await this.salesService.storeIdempotency(idempotencyKey, result);
    }

    return result;
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Histórico de compras', description: 'Retorna todas as compras realizadas por um usuário' })
  @ApiResponse({ status: 200, description: 'Histórico retornado com sucesso' })
  @ApiResponse({ status: 400, description: 'userId inválido' })
  async getUserHistory(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.salesService.getUserPurchaseHistory(userId);
  }
}
