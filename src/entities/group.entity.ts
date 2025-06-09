import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Photo, Poll } from '.';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  inviteCode: string;

  @Column('uuid')
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => User, (user) => user.groups)
  @JoinTable()
  members: User[];

  @OneToMany(() => Poll, (poll) => poll.group)
  polls: Poll[];

  @OneToMany(() => Photo, (photo) => photo.group)
  photos: Photo[];
}
