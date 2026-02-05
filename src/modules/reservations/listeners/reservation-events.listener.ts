import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
@Controller()
export class ReservationEventsListener {
  private readonly logger = new Logger(ReservationEventsListener.name);

  private ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    channel.ack(message);
  }

  private nack(context: RmqContext, requeue = true) {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    // TODO: implement DLQ after 3 retry attempts
    channel.nack(message, false, requeue);
  }

  @EventPattern('reservation.created')
  async handleReservationCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log(`Reservation created event received: ${JSON.stringify(data)}`);
      this.ack(context);
    } catch (error) {
      this.logger.error('Failed to process reservation.created', error);
      this.nack(context);
    }
  }

  @EventPattern('reservation.expired')
  async handleReservationExpired(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log(`Reservation expired event received: ${JSON.stringify(data)}`);
      this.ack(context);
    } catch (error) {
      this.logger.error('Failed to process reservation.expired', error);
      this.nack(context);
    }
  }

  @EventPattern('seat.released')
  async handleSeatReleased(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log(`Seat released event received: ${JSON.stringify(data)}`);
      this.ack(context);
    } catch (error) {
      this.logger.error('Failed to process seat.released', error);
      this.nack(context);
    }
  }

  @EventPattern('payment.confirmed')
  async handlePaymentConfirmed(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log(`Payment confirmed event received: ${JSON.stringify(data)}`);
      this.ack(context);
    } catch (error) {
      this.logger.error('Failed to process payment.confirmed', error);
      this.nack(context);
    }
  }
}