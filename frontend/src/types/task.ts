export interface Task {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface TaskStats {
  todo: number;
  'in-progress': number;
  completed: number;
}

export interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  deadline?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  deadline?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  deadline?: string;
}
