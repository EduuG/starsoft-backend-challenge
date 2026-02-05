import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Session } from "../sessions/session.entity";
import { ReservationSeat } from "./reservation-seat.entity";

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CONFIRMED = 'CONFIRMED',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => Session)
  session: Session;

  @OneToMany(
    () => ReservationSeat,
    reservationSeat => reservationSeat.reservation,
  )
  
  reservationSeats: ReservationSeat[];

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.ACTIVE,
  })
  status: ReservationStatus;
}