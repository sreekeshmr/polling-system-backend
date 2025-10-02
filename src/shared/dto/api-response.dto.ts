export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: Date;
}

export class ApiResponseDto {
  static success<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date(),
    };
  }

  static error<T = any>(message: string, error?: string): ApiResponse<T> {
    return {
      success: false,
      message,
      error,
      timestamp: new Date(),
    };
  }

  static paginated<T>(
    message: string, 
    data: T[], 
    page: number, 
    limit: number, 
    total: number
  ): ApiResponse<{ data: T[]; pagination: PaginationInfo }> {
    return {
      success: true,
      message,
      data: {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      },
      timestamp: new Date(),
    };
  }
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}