import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // Confirm payment and create a sale.
  @Post('confirm-payment')
  async confirmPayment(@Body() dto: ConfirmPaymentDto) {
    if (!dto.reservationId || !dto.userId) {
      throw new BadRequestException('reservationId and userId are required');
    }

    return this.salesService.confirmPayment(dto.reservationId, dto.userId);
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
