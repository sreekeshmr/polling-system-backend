import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Poll, PollVisibility, PollStatus } from '../shared/entities/poll.entity';
import { User, UserRole } from '../shared/entities/user.entity';
import { CreatePollDto } from './dto/create-poll.dto';
import { UpdatePollDto } from './dto/update-poll.dto';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private pollsRepository: Repository<Poll>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createPollDto: CreatePollDto, user: User): Promise<Poll> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + createPollDto.durationHours);

    if (createPollDto.durationHours > 2) {
      throw new BadRequestException('Poll duration cannot exceed 2 hours');
    }

    const poll = this.pollsRepository.create({
      ...createPollDto,
      expiresAt,
      createdBy: user,
    });

    if (createPollDto.visibility === PollVisibility.PRIVATE && createPollDto.allowedUserEmails) {
      const allowedUsers = await this.usersRepository.find({
        where: { email: In(createPollDto.allowedUserEmails) },
      });
      poll.allowedUsers = allowedUsers;
    }

    return this.pollsRepository.save(poll);
  }

  async findAllForUser(user: User): Promise<Poll[]> {
    // Get all public polls
    const publicPolls = await this.pollsRepository.find({
      where: { visibility: PollVisibility.PUBLIC },
      relations: ['createdBy', 'votes', 'allowedUsers'],
    });

    // Get private polls where user is allowed
    const privatePolls = await this.pollsRepository
      .createQueryBuilder('poll')
      .leftJoinAndSelect('poll.allowedUsers', 'allowedUser')
      .leftJoinAndSelect('poll.createdBy', 'createdBy')
      .leftJoinAndSelect('poll.votes', 'votes')
      .where('poll.visibility = :visibility', { visibility: PollVisibility.PRIVATE })
      .andWhere('allowedUser.id = :userId', { userId: user.id })
      .getMany();

    const allPolls = [...publicPolls, ...privatePolls];

    // Update status for expired polls
    for (const poll of allPolls) {
      if (poll.isExpired() && poll.status !== PollStatus.EXPIRED) {
        poll.status = PollStatus.EXPIRED;
        await this.pollsRepository.save(poll);
      }
    }

    return allPolls;
  }

  async getMyPolls(user: User): Promise<Poll[]> {
    const polls = await this.pollsRepository.find({
      where: { createdBy: { id: user.id } },
      relations: ['votes', 'allowedUsers', 'createdBy'],
      order: { createdAt: 'DESC' },
    });

    // Update status for expired polls
    for (const poll of polls) {
      if (poll.isExpired() && poll.status !== PollStatus.EXPIRED) {
        poll.status = PollStatus.EXPIRED;
        await this.pollsRepository.save(poll);
      }
    }

    return polls;
  }

  async findOne(id: string, user: User): Promise<Poll> {
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'votes', 'votes.user', 'allowedUsers'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    // Check if user can access this poll
    if (poll.visibility === PollVisibility.PRIVATE) {
      const isAllowed = poll.allowedUsers?.some(allowedUser => allowedUser.id === user.id);
      const isCreator = poll.createdBy.id === user.id;
      
      if (!isAllowed && !isCreator && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('You do not have permission to view this poll');
      }
    }

    if (poll.isExpired() && poll.status !== PollStatus.EXPIRED) {
      poll.status = PollStatus.EXPIRED;
      await this.pollsRepository.save(poll);
    }

    return poll;
  }

  async update(id: string, updatePollDto: UpdatePollDto, user: User): Promise<Poll> {
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'allowedUsers'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only edit your own polls');
    }

    if (poll.isExpired()) {
      throw new BadRequestException('Cannot edit expired polls');
    }

    // Update basic fields if provided
    if (updatePollDto.title !== undefined) {
      poll.title = updatePollDto.title;
    }

    if (updatePollDto.options !== undefined) {
      poll.options = updatePollDto.options;
    }

    if (updatePollDto.visibility !== undefined) {
      poll.visibility = updatePollDto.visibility;
    }

    // Handle duration update - recalculate expiry
    if (updatePollDto.durationHours !== undefined) {
      if (updatePollDto.durationHours > 2) {
        throw new BadRequestException('Poll duration cannot exceed 2 hours');
      }
      
      const newExpiresAt = new Date();
      newExpiresAt.setHours(newExpiresAt.getHours() + updatePollDto.durationHours);
      poll.expiresAt = newExpiresAt;
    }

    // Handle allowed users for private polls
    if (updatePollDto.allowedUserEmails !== undefined) {
      const currentVisibility = poll.visibility;
      const newVisibility = updatePollDto.visibility || currentVisibility;
      
      if (newVisibility === PollVisibility.PRIVATE) {
        const allowedUsers = await this.usersRepository.find({
          where: { email: In(updatePollDto.allowedUserEmails) },
        });
        poll.allowedUsers = allowedUsers;
      } else {
        // If changing from private to public, clear allowed users
        poll.allowedUsers = [];
      }
    }

    return this.pollsRepository.save(poll);
  }

  async remove(id: string, user: User): Promise<void> {
    const poll = await this.pollsRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.createdBy.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own polls');
    }

    await this.pollsRepository.remove(poll);
  }

  async getExpiredPolls(): Promise<Poll[]> {
    const polls = await this.pollsRepository.find({
      where: { status: PollStatus.ACTIVE },
      relations: ['createdBy', 'votes'],
    });

    const expiredPolls = polls.filter(poll => poll.isExpired());
    for (const poll of expiredPolls) {
      poll.status = PollStatus.EXPIRED;
      await this.pollsRepository.save(poll);
    }

    return expiredPolls;
  }

  async getActivePolls(user: User): Promise<Poll[]> {
    const polls = await this.findAllForUser(user);
    return polls.filter(poll => poll.status === PollStatus.ACTIVE && !poll.isExpired());
  }

  async getPollStats(user: User): Promise<{
    total: number;
    active: number;
    expired: number;
    public: number;
    private: number;
    totalVotes: number;
  }> {
    const myPolls = await this.getMyPolls(user);
    
    const total = myPolls.length;
    const active = myPolls.filter(poll => poll.status === PollStatus.ACTIVE && !poll.isExpired()).length;
    const expired = myPolls.filter(poll => poll.status === PollStatus.EXPIRED || poll.isExpired()).length;
    const publicPolls = myPolls.filter(poll => poll.visibility === PollVisibility.PUBLIC).length;
    const privatePolls = myPolls.filter(poll => poll.visibility === PollVisibility.PRIVATE).length;
    const totalVotes = myPolls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0);

    return {
      total,
      active,
      expired,
      public: publicPolls,
      private: privatePolls,
      totalVotes,
    };
  }

  // Helper method to check if user can vote on a poll
  async canUserVote(pollId: string, userId: string): Promise<boolean> {
    const poll = await this.pollsRepository.findOne({
      where: { id: pollId },
      relations: ['allowedUsers', 'createdBy'],
    });

    if (!poll || poll.isExpired()) {
      return false;
    }

    if (poll.visibility === PollVisibility.PUBLIC) {
      return true;
    }

    // For private polls, check if user is in allowedUsers or is the creator
    const isAllowed = poll.allowedUsers?.some(user => user.id === userId);
    const isCreator = poll.createdBy.id === userId;
    
    return isAllowed || isCreator;
  }

  // Method to check if user has already voted on a poll
  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const poll = await this.pollsRepository.findOne({
      where: { id: pollId },
      relations: ['votes', 'votes.user'],
    });

    if (!poll) {
      return false;
    }

    return poll.votes?.some(vote => vote.user.id === userId) || false;
  }

  // Method to get user's vote for a specific poll
  async getUserVote(pollId: string, userId: string): Promise<string | null> {
    const poll = await this.pollsRepository.findOne({
      where: { id: pollId },
      relations: ['votes', 'votes.user'],
    });

    if (!poll) {
      return null;
    }

    const userVote = poll.votes?.find(vote => vote.user.id === userId);
    return userVote ? userVote.selectedOption : null;
  }

  // Method to add user to private poll's allowed users
  async addUserToPrivatePoll(pollId: string, userEmail: string, adminUser: User): Promise<Poll> {
    const poll = await this.pollsRepository.findOne({
      where: { id: pollId },
      relations: ['createdBy', 'allowedUsers'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.createdBy.id !== adminUser.id && adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only modify your own polls');
    }

    if (poll.visibility !== PollVisibility.PRIVATE) {
      throw new BadRequestException('Can only add users to private polls');
    }

    const userToAdd = await this.usersRepository.findOne({
      where: { email: userEmail },
    });

    if (!userToAdd) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already allowed
    const isAlreadyAllowed = poll.allowedUsers?.some(user => user.id === userToAdd.id);
    if (isAlreadyAllowed) {
      throw new BadRequestException('User is already allowed to vote on this poll');
    }

    // Add user to allowed users
    poll.allowedUsers = [...(poll.allowedUsers || []), userToAdd];
    return this.pollsRepository.save(poll);
  }

  // Method to remove user from private poll's allowed users
  async removeUserFromPrivatePoll(pollId: string, userEmail: string, adminUser: User): Promise<Poll> {
    const poll = await this.pollsRepository.findOne({
      where: { id: pollId },
      relations: ['createdBy', 'allowedUsers'],
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.createdBy.id !== adminUser.id && adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only modify your own polls');
    }

    if (poll.visibility !== PollVisibility.PRIVATE) {
      throw new BadRequestException('Can only remove users from private polls');
    }

    const userToRemove = await this.usersRepository.findOne({
      where: { email: userEmail },
    });

    if (!userToRemove) {
      throw new NotFoundException('User not found');
    }

    // Remove user from allowed users
    poll.allowedUsers = poll.allowedUsers?.filter(user => user.id !== userToRemove.id) || [];
    return this.pollsRepository.save(poll);
  }
}