import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Poll } from './poll.entity';

@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  selectedOption: string; // activity ID

  @ManyToOne(() => Poll, (poll) => poll.votes)
  poll: Poll;
}
