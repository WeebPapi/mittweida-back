// src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Group, Photo } from '.';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  profilePicture: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => Group, (group) => group.members)
  groups: Group[];

  @OneToMany(() => Photo, (photo) => photo.user)
  photos: Photo[];
}

// src/entities/vote.entity.ts

// src/entities/photo.entity.ts
