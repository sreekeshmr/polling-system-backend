import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { Poll } from '../shared/entities/poll.entity';
import { User } from '../shared/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Poll, User])],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}