export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  metadata: {
    total: number;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
  };
}; 