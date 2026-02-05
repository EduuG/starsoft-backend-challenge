import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Seat } from '../seats/seat.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  movie: string;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column()
  room: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @OneToMany(() => Seat, seat => seat.session)
  seats: Seat[];
}