import type { ApiResponse } from '../types';

export class ApiError extends Error {
  constructor(
    public readonly code: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function unwrap<T>(response: ApiResponse<T>): T {
  if (response.code !== 200) {
    throw new ApiError(response.code, response.message);
  }
  return response.data;
}
