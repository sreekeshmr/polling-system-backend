import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  Unique 
} from 'typeorm';
import { User } from './user.entity';
import { Poll } from './poll.entity';

@Entity()
@Unique(['user', 'poll'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  selectedOption: string;

  @ManyToOne(() => User, user => user.votes)
  user: User;

  @ManyToOne(() => Poll, poll => poll.votes)
  poll: Poll;

  @CreateDateColumn()
  createdAt: Date;
}