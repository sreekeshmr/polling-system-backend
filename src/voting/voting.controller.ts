import { Controller, Post, Get, Body, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VotingService } from './voting.service';
import { CreateVoteDto } from './dto/create-vote.dto';

@Controller('voting')
@UseGuards(AuthGuard('jwt'))
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Post(':pollId/vote')
  async vote(
    @Param('pollId') pollId: string,
    @Body() createVoteDto: CreateVoteDto,
    @Request() req,
  ) {
    const vote = await this.votingService.vote(pollId, createVoteDto.selectedOption, req.user);
    return {
      message: 'Vote cast successfully',
      vote,
    };
  }

  @Get('my-votes')
  async getMyVotes(@Request() req) {
    const votes = await this.votingService.getUserVotes(req.user);
    return {
      message: 'Your votes retrieved successfully',
      votes,
      count: votes.length,
    };
  }

  @Get(':pollId/results')
  async getPollResults(@Param('pollId') pollId: string, @Request() req) {
    const results = await this.votingService.getPollResults(pollId, req.user);
    return {
      message: 'Poll results retrieved successfully',
      ...results,
    };
  }

  @Get(':pollId/my-vote')
  async getMyVoteForPoll(
    @Param('pollId') pollId: string,
    @Request() req,
  ) {
    const vote = await this.votingService.getUserVoteForPoll(pollId, req.user.id);
    return {
      message: 'Your vote status retrieved successfully',
      hasVoted: !!vote,
      vote,
    };
  }

  @Get(':pollId/has-voted')
  async hasUserVoted(
    @Param('pollId') pollId: string,
    @Request() req,
  ) {
    const hasVoted = await this.votingService.hasUserVoted(pollId, req.user.id);
    return {
      message: 'Vote status retrieved successfully',
      hasVoted,
    };
  }

  @Delete(':pollId/vote')
  async deleteVote(
    @Param('pollId') pollId: string,
    @Request() req,
  ) {
    await this.votingService.deleteVote(pollId, req.user);
    return {
      message: 'Vote deleted successfully',
    };
  }
}