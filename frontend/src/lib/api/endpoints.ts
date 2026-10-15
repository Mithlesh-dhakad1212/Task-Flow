import {
  type AuthResponse,
  type DashboardSummary,
  type Paginated,
  type Project,
  type ProjectInput,
  type ProjectListParams,
  type Task,
  type TaskInput,
  type TaskListParams,
  type User,
} from '../types';
import { api } from './client';

export const authApi = {
  login: (body: { email: string; password: string }) =>
    api<AuthResponse>('/auth/login', { method: 'POST', body, skipAuthRetry: true }),
  register: (body: { name: string; email: string; password: string }) =>
    api<AuthResponse>('/auth/register', { method: 'POST', body, skipAuthRetry: true }),
  logout: () => api<void>('/auth/logout', { method: 'POST', skipAuthRetry: true }),
  me: () => api<User>('/auth/me'),
};

export const projectsApi = {
  list: (params: ProjectListParams, signal?: AbortSignal) =>
    api<Paginated<Project>>('/projects', { query: { ...params }, signal }),
  get: (id: string, signal?: AbortSignal) => api<Project>(`/projects/${id}`, { signal }),
  create: (body: ProjectInput) => api<Project>('/projects', { method: 'POST', body }),
  update: (id: string, body: Partial<ProjectInput>) => api<Project>(`/projects/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api<void>(`/projects/${id}`, { method: 'DELETE' }),
};

export const tasksApi = {
  list: (params: TaskListParams, signal?: AbortSignal) =>
    api<Paginated<Task>>('/tasks', { query: { ...params }, signal }),
  get: (id: string, signal?: AbortSignal) => api<Task>(`/tasks/${id}`, { signal }),
  create: (body: TaskInput) => api<Task>('/tasks', { method: 'POST', body }),
  update: (id: string, body: Partial<TaskInput>) => api<Task>(`/tasks/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => api<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = {
  get: (signal?: AbortSignal) => api<DashboardSummary>('/dashboard', { signal }),
};
