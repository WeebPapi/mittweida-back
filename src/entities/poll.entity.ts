import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { Vote } from './vote.entity';

@Entity('polls')
export class Poll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  question: string;

  @Column('json')
  options: string[]; // Array of activity IDs

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isActive: boolean;

  @ManyToOne(() => Group, (group) => group.polls)
  group: Group;

  @OneToMany(() => Vote, (vote) => vote.poll)
  votes: Vote[];
}
