export interface BaseRepository<T, CreateInput, UpdateInput> {
  findById(id: number): Promise<T | null>;
  findMany(options?: any): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: number, data: UpdateInput): Promise<T>;
  delete(id: number): Promise<void>;
  count(options?: any): Promise<number>;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}