import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { Seat } from '../seats/seat.entity';

@Entity('sessions')
@Unique('UQ_session_movie_time_room', ['movieTitle', 'startsAt', 'roomId'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  movieTitle: string;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column()
  roomId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @OneToMany(() => Seat, seat => seat.session)
  seats: Seat[];
}
