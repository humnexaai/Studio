export interface ApiError {
  error: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface CreateProjectRequest {
  name: string;
  framework: string;
}

export interface ProjectDto {
  id: string;
  name: string;
  framework: string;
  status: string;
  createdAt: string;
}
