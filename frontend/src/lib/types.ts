// Mirrors the API DTOs (see docs/openapi.json).

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProjectColor = 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan';
export type SortOrder = 'asc' | 'desc';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ProjectStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  progress: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: ProjectColor;
  createdAt: string;
  updatedAt: string;
  stats: ProjectStats;
}

export interface Task {
  id: string;
  projectId: string;
  project: { id: string; name: string; color: ProjectColor };
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** YYYY-MM-DD */
  dueDate: string;
  isOverdue: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totals: {
    projects: number;
    tasks: number;
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
    dueToday: number;
    completionRate: number;
  };
  projects: { id: string; name: string; color: ProjectColor; stats: ProjectStats }[];
  upcoming: Task[];
  overdue: Task[];
  /** Completions per day, last 14 days, oldest first */
  activity: { date: string; completed: number }[];
  openByPriority: Record<TaskPriority, number>;
}

export interface ProjectInput {
  name: string;
  description?: string;
  color?: ProjectColor;
}

export interface TaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate: string;
}

export interface ProjectListParams {
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  order?: SortOrder;
  page?: number;
  limit?: number;
}

export interface TaskListParams {
  projectId?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  search?: string;
  overdue?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'status';
  order?: SortOrder;
  page?: number;
  limit?: number;
}
