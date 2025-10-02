import { PollStatus, PollVisibility } from '../../shared/entities/poll.entity';

export class PollResponseDto {
  id: string;
  title: string;
  options: string[];
  visibility: PollVisibility;
  status: PollStatus;
  expiresAt: Date;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    email: string;
  };
  userVote?: string;
  canVote: boolean;
}