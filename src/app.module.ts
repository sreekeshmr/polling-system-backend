import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PollsModule } from './polls/polls.module';
import { VotingModule } from './voting/voting.module';
import { User } from './shared/entities/user.entity';
import { Poll } from './shared/entities/poll.entity';
import { Vote } from './shared/entities/vote.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'polling.db',
      entities: [User, Poll, Vote],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: true, // Enable logging to see SQL queries
    }),
    AuthModule,
    UsersModule,
    PollsModule,
    VotingModule,
  ],
})
export class AppModule {}