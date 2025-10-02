import { PollStatus, PollVisibility } from '../../shared/entities/poll.entity';

export class PollResultsDto {
  poll: {
    id: string;
    title: string;
    options: string[];
    status: PollStatus;
    expiresAt: Date;
    totalVotes: number;
  };
  results: Record<string, number>;
  userVote?: string;
}