import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Reservation } from "./reservation.entity";
import { Seat } from "../seats/seat.entity";

@Entity('reservation_seats')
export class ReservationSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Reservation, reservation => reservation.reservationSeats, {
    onDelete: 'CASCADE',
  })
  reservation: Reservation;

  @ManyToOne(() => Seat, {
    onDelete: 'CASCADE',
  })
  seat: Seat;
}