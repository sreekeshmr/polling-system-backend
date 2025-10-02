import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../shared/entities/user.entity';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';
import { PollQueryDto } from './dto/poll-query.dto';
import { PollStatus, PollVisibility } from '../shared/entities/poll.entity';

@Controller('polls')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createPollDto: CreatePollDto, @Request() req) {
    const poll = await this.pollsService.create(createPollDto, req.user);
    return {
      message: 'Poll created successfully',
      poll,
    };
  }

  @Get()
  async findAll(@Request() req, @Query() query: PollQueryDto) {
    let polls;
    
    // Handle myPolls filter
    if (query.myPolls && req.user.role === UserRole.ADMIN) {
      polls = await this.pollsService.getMyPolls(req.user);
    } else {
      polls = await this.pollsService.findAllForUser(req.user);
    }

    // Apply additional filters
    if (query.status) {
      polls = polls.filter(poll => poll.status === query.status);
    }

    if (query.visibility) {
      polls = polls.filter(poll => poll.visibility === query.visibility);
    }

    // Handle active/expired filters
    if (query.active === true) {
      polls = polls.filter(poll => poll.status === PollStatus.ACTIVE && !poll.isExpired());
    }

    if (query.expired === true) {
      polls = polls.filter(poll => poll.status === PollStatus.EXPIRED || poll.isExpired());
    }

    // Handle includeExpired filter (default behavior: exclude expired)
    if (query.includeExpired === false) {
      polls = polls.filter(poll => !poll.isExpired());
    }

    return {
      message: 'Polls retrieved successfully',
      polls,
      count: polls.length,
    };
  }

  @Get('my-polls')
  @Roles(UserRole.ADMIN)
  async getMyPolls(@Request() req) {
    const polls = await this.pollsService.getMyPolls(req.user);
    return {
      message: 'Your polls retrieved successfully',
      polls,
      count: polls.length,
    };
  }

  @Get('active')
  async getActivePolls(@Request() req) {
    const polls = await this.pollsService.getActivePolls(req.user);
    return {
      message: 'Active polls retrieved successfully',
      polls,
      count: polls.length,
    };
  }

  @Get('expired')
  async getExpiredPolls(@Request() req) {
    const polls = await this.pollsService.findAllForUser(req.user);
    const expiredPolls = polls.filter(poll => poll.status === PollStatus.EXPIRED || poll.isExpired());
    
    return {
      message: 'Expired polls retrieved successfully',
      polls: expiredPolls,
      count: expiredPolls.length,
    };
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getPollStats(@Request() req) {
    const stats = await this.pollsService.getPollStats(req.user);
    return {
      message: 'Poll statistics retrieved successfully',
      stats,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const poll = await this.pollsService.findOne(id, req.user);
    return {
      message: 'Poll retrieved successfully',
      poll,
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updatePollDto: UpdatePollDto, @Request() req) {
    const poll = await this.pollsService.update(id, updatePollDto, req.user);
    return {
      message: 'Poll updated successfully',
      poll,
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string, @Request() req) {
    await this.pollsService.remove(id, req.user);
    return {
      message: 'Poll deleted successfully',
    };
  }

  @Get(':id/can-vote')
  async canUserVote(@Param('id') id: string, @Request() req) {
    const canVote = await this.pollsService.canUserVote(id, req.user.id);
    return {
      message: 'Vote eligibility checked',
      canVote,
    };
  }

  @Get(':id/has-voted')
  async hasUserVoted(@Param('id') id: string, @Request() req) {
    const hasVoted = await this.pollsService.hasUserVoted(id, req.user.id);
    return {
      message: 'Vote status checked',
      hasVoted,
    };
  }

  @Get(':id/my-vote')
  async getUserVote(@Param('id') id: string, @Request() req) {
    const vote = await this.pollsService.getUserVote(id, req.user.id);
    return {
      message: 'User vote retrieved',
      vote,
    };
  }

  @Post(':id/allowed-users')
  @Roles(UserRole.ADMIN)
  async addUserToPrivatePoll(
    @Param('id') id: string,
    @Body('email') email: string,
    @Request() req,
  ) {
    const poll = await this.pollsService.addUserToPrivatePoll(id, email, req.user);
    return {
      message: 'User added to private poll successfully',
      poll,
    };
  }

  @Delete(':id/allowed-users')
  @Roles(UserRole.ADMIN)
  async removeUserFromPrivatePoll(
    @Param('id') id: string,
    @Body('email') email: string,
    @Request() req,
  ) {
    const poll = await this.pollsService.removeUserFromPrivatePoll(id, email, req.user);
    return {
      message: 'User removed from private poll successfully',
      poll,
    };
  }
}