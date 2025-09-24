import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStats, CreateTaskRequest, UpdateTaskRequest } from '../types/task';
import axios from 'axios';

interface UseTasksReturn {
  tasks: Task[];
  stats: TaskStats;
  loading: boolean;
  error: string | null;
  createTask: (taskData: CreateTaskRequest) => Promise<void>;
  updateTask: (taskId: string, updates: UpdateTaskRequest) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export const useTasks = (projectId: string, userId: string): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({ todo: 0, 'in-progress': 0, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = 'http://localhost:3001';

  // Normalize server task to our Task type (e.g., map _id -> id)
  const normalizeTask = (t: any): Task => ({
    id: t.id ?? t._id,
    projectId: t.projectId,
    userId: t.userId,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    deadline: t.deadline,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  });

  const fetchTasks = useCallback(async () => {
    if (!projectId || !userId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('codexa_jwt');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE}/projects/${projectId}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const serverTasks = response.data.tasks || [];
      setTasks(serverTasks.map(normalizeTask));
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId, userId, API_BASE]);

  const fetchStats = useCallback(async () => {
    if (!projectId || !userId) return;

    try {
      const token = localStorage.getItem('codexa_jwt');
      if (!token) return;

      const response = await axios.get(`${API_BASE}/projects/${projectId}/tasks/stats`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setStats(response.data.stats || { todo: 0, 'in-progress': 0, completed: 0 });
    } catch (err) {
      console.error('Failed to fetch task stats:', err);
    }
  }, [projectId, userId, API_BASE]);

  const createTask = useCallback(async (taskData: CreateTaskRequest) => {
    if (!projectId) throw new Error('Project ID is required');

    try {
      const token = localStorage.getItem('codexa_jwt');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.post(`${API_BASE}/projects/${projectId}/tasks`, taskData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const newTask = normalizeTask(response.data.task);
      setTasks(prev => [newTask, ...prev]);
      await fetchStats();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      throw new Error(err.response?.data?.message || 'Failed to create task');
    }
  }, [projectId, API_BASE, fetchStats]);

  const updateTask = useCallback(async (taskId: string, updates: UpdateTaskRequest) => {
    try {
      const token = localStorage.getItem('codexa_jwt');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.put(`${API_BASE}/tasks/${taskId}`, updates, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const updatedTask = normalizeTask(response.data.task);
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
      await fetchStats();
    } catch (err: any) {
      console.error('Failed to update task:', err);
      throw new Error(err.response?.data?.message || 'Failed to update task');
    }
  }, [API_BASE, fetchStats]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const token = localStorage.getItem('codexa_jwt');
      if (!token) throw new Error('No authentication token found');

      await axios.delete(`${API_BASE}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setTasks(prev => prev.filter(task => task.id !== taskId));
      await fetchStats();
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      throw new Error(err.response?.data?.message || 'Failed to delete task');
    }
  }, [API_BASE, fetchStats]);

  const refreshTasks = useCallback(async () => {
    await Promise.all([fetchTasks(), fetchStats()]);
  }, [fetchTasks, fetchStats]);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  return {
    tasks,
    stats,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks
  };
};
