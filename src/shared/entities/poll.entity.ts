import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany, 
  ManyToMany, 
  JoinTable, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { User } from './user.entity';
import { Vote } from './vote.entity';

export enum PollStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export enum PollVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

@Entity()
export class Poll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('simple-array')
  options: string[];

  @Column({ 
    type: 'varchar', 
    enum: PollVisibility, 
    default: PollVisibility.PUBLIC 
  })
  visibility: PollVisibility;

  @Column({ 
    type: 'varchar', 
    enum: PollStatus, 
    default: PollStatus.ACTIVE 
  })
  status: PollStatus;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => User, user => user.polls)
  createdBy: User;

  @OneToMany(() => Vote, vote => vote.poll)
  votes: Vote[];

  @ManyToMany(() => User)
  @JoinTable()
  allowedUsers: User[];

  @Column({ default: 0 })
  totalVotes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  canUserVote(user: User): boolean {
    if (this.isExpired()) return false;
    if (this.visibility === PollVisibility.PUBLIC) return true;
    return this.allowedUsers?.some(allowedUser => allowedUser.id === user.id) || false;
  }

  getResults(): Record<string, number> {
    const results: Record<string, number> = {};
    this.options.forEach(option => {
      results[option] = 0;
    });

    this.votes?.forEach(vote => {
      if (results.hasOwnProperty(vote.selectedOption)) {
        results[vote.selectedOption]++;
      }
    });

    return results;
  }
}