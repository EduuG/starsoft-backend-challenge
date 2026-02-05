import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Seat } from '../seats/seat.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ManyToMany(() => Seat)
  @JoinTable({
    name: 'sale_seats',
  })
  seats: Seat[];

  @Column({ type: 'timestamp' })
  createdAt: Date;
}