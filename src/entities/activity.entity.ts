import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column()
  address: string;

  @Column()
  category: string; // 'food', 'coffee', 'historical', 'photo-ops', etc.

  @Column({ nullable: true })
  videoUrl: string;

  @Column('json', { nullable: true })
  openingHours: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  rating: number;

  @CreateDateColumn()
  createdAt: Date;
}
