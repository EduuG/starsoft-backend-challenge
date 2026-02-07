import { Controller, Post, Body, Get, Param, BadRequestException, Headers } from '@nestjs/common';
import { SalesService } from './sales.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // Confirm payment and create a sale.
  @Post('confirm-payment')
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

  // User purchase history.
  @Get('users/:userId')
  async getUserHistory(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.salesService.getUserPurchaseHistory(userId);
  }
}
