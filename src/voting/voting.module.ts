import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotingService } from './voting.service';
import { VotingController } from './voting.controller';
import { Vote } from '../shared/entities/vote.entity';
import { Poll } from '../shared/entities/poll.entity';
import { User } from '../shared/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, Poll, User])],
  controllers: [VotingController],
  providers: [VotingService],
  exports: [VotingService],
})
export class VotingModule {}