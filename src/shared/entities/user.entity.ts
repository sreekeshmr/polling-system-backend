import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { Poll } from './poll.entity';
import { Vote } from './vote.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ 
    type: 'varchar', 
    default: UserRole.USER,
    enum: UserRole 
  })
  role: UserRole;

  @OneToMany(() => Poll, poll => poll.createdBy)
  polls: Poll[];

  @OneToMany(() => Vote, vote => vote.user)
  votes: Vote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}