import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vote } from '../shared/entities/vote.entity';
import { Poll, PollStatus } from '../shared/entities/poll.entity';
import { User } from '../shared/entities/user.entity';

@Injectable()
export class VotingService {
  constructor(
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
    @InjectRepository(Poll)
    private pollsRepository: Repository<Poll>,
  ) {}

  async vote(pollId: string, selectedOption: string, user: User): Promise<any> {
    // Find poll with relations
    const poll = await this.pollsRepository.findOne({
      where: { id: pollId },
      relations: ['votes', 'allowedUsers', 'createdBy'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if poll is expired
    if (poll.isExpired()) {
      poll.status = PollStatus.EXPIRED;
      await this.pollsRepository.save(poll);
      throw new BadRequestException('Cannot vote on expired poll');
    }

    // Check if user is allowed to vote
    if (!poll.canUserVote(user)) {
      throw new ForbiddenException('You are not allowed to vote on this poll');
    }

    // Check for duplicate vote
    const existingVote = await this.votesRepository.findOne({
      where: { 
        user: { id: user.id }, 
        poll: { id: pollId } 
      },
    });

    if (existingVote) {
      throw new ConflictException('You have already voted on this poll');
    }

    // Validate selected option
    if (!poll.options.includes(selectedOption)) {
      throw new BadRequestException('Invalid option selected');
    }

    // Create and save vote
    const vote = this.votesRepository.create({
      selectedOption,
      user,
      poll,
    });

    // Update poll vote count
    poll.totalVotes += 1;
    await this.pollsRepository.save(poll);

    const savedVote = await this.votesRepository.save(vote);
    
    // Return vote without sensitive data using object destructuring
    const { user: voteUser, ...voteWithoutUser } = savedVote;
    const { password, ...safeUser } = voteUser;
    
    return {
      ...voteWithoutUser,
      user: safeUser,
    };
  }

  async getUserVotes(user: User): Promise<any[]> {
    const votes = await this.votesRepository.find({
      where: { user: { id: user.id } },
      relations: ['poll', 'poll.createdBy'],
    });

    // Remove sensitive data using object transformation
    return votes.map(vote => {
      const { poll, ...voteWithoutPoll } = vote;
      const { createdBy, ...pollWithoutCreator } = poll;
      const { password, ...safeCreator } = createdBy;

      return {
        ...voteWithoutPoll,
        poll: {
          ...pollWithoutCreator,
          createdBy: safeCreator,
        },
      };
    });
  }

  async getPollResults(pollId: string, user: User): Promise<any> {
    const poll = await this.pollsRepository.findOne({
      where: { id: pollId },
      relations: ['votes', 'votes.user', 'allowedUsers', 'createdBy'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user can view results
    const canViewResults = this.canUserViewResults(poll, user);
    if (!canViewResults) {
      throw new ForbiddenException('You cannot view results for this poll');
    }

    // Update poll status if expired
    if (poll.isExpired() && poll.status !== PollStatus.EXPIRED) {
      poll.status = PollStatus.EXPIRED;
      await this.pollsRepository.save(poll);
    }

    // Calculate results
    const results = this.calculateResults(poll);
    
    // Find user's vote
    const userVote = poll.votes.find(vote => vote.user.id === user.id)?.selectedOption;

    // Remove sensitive data using object transformation
    const { createdBy, votes: pollVotes, ...pollWithoutSensitive } = poll;
    const { password, ...safeCreator } = createdBy;

    const safeVotes = pollVotes.map(vote => {
      const { user: voteUser, ...voteWithoutUser } = vote;
      const { password, ...safeVoteUser } = voteUser;
      return {
        ...voteWithoutUser,
        user: safeVoteUser,
      };
    });

    return {
      poll: {
        ...pollWithoutSensitive,
        createdBy: safeCreator,
        votes: safeVotes,
      },
      results,
      userVote,
      percentage: this.calculatePercentages(results, poll.totalVotes),
    };
  }

  private canUserViewResults(poll: Poll, user: User): boolean {
    // Always allow if user created the poll
    if (poll.createdBy.id === user.id) {
      return true;
    }

    // Always allow for admins
    if (user.role === 'admin') {
      return true;
    }

    // Allow if poll is expired (anyone can see results after expiry)
    if (poll.isExpired()) {
      return true;
    }

    // For active polls, only allow if:
    // - Poll is public, OR
    // - User is in allowed users list for private polls
    if (poll.visibility === 'public') {
      return true;
    }

    if (poll.visibility === 'private') {
      return poll.allowedUsers.some(allowedUser => allowedUser.id === user.id);
    }

    return false;
  }

  private calculateResults(poll: Poll): Record<string, number> {
    const results: Record<string, number> = {};
    
    // Initialize all options with 0 votes
    poll.options.forEach(option => {
      results[option] = 0;
    });

    // Count votes for each option
    poll.votes?.forEach(vote => {
      if (results.hasOwnProperty(vote.selectedOption)) {
        results[vote.selectedOption]++;
      }
    });

    return results;
  }

  private calculatePercentages(results: Record<string, number>, totalVotes: number): Record<string, number> {
    const percentages: Record<string, number> = {};
    
    if (totalVotes === 0) {
      Object.keys(results).forEach(option => {
        percentages[option] = 0;
      });
      return percentages;
    }

    Object.keys(results).forEach(option => {
      percentages[option] = Math.round((results[option] / totalVotes) * 100);
    });

    return percentages;
  }

  async getUserVoteForPoll(pollId: string, userId: string): Promise<string | null> {
    const vote = await this.votesRepository.findOne({
      where: { 
        user: { id: userId }, 
        poll: { id: pollId } 
      },
    });

    return vote ? vote.selectedOption : null;
  }

  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const vote = await this.votesRepository.findOne({
      where: { 
        user: { id: userId }, 
        poll: { id: pollId } 
      },
    });

    return !!vote;
  }

  async deleteVote(pollId: string, user: User): Promise<void> {
  const vote = await this.votesRepository.findOne({
    where: { 
      user: { id: user.id }, 
      poll: { id: pollId } 
    },
    relations: ['poll'],
  });

  if (!vote) {
    throw new NotFoundException('Vote not found');
  }

  // Check if poll is still active
  if (vote.poll.isExpired()) {
    throw new BadRequestException('Cannot delete vote from expired poll');
  }

  // Update poll vote count
  const poll = await this.pollsRepository.findOne({
    where: { id: pollId },
  });

  if (poll) {
    poll.totalVotes = Math.max(0, poll.totalVotes - 1);
    await this.pollsRepository.save(poll);
  }

  await this.votesRepository.remove(vote);
}
}