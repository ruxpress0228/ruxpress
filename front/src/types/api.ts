export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
