import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Task, TaskStatus, TaskPriority, TaskFormData } from '../types/task';
import { TaskColumn } from './TaskColumn';
import { TaskForm } from './TaskForm';
import { TaskFilters } from './TaskFilters';
import { TaskStats } from './TaskStats';
import { useTasks } from '../hooks/useTasks';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useNotifications } from '../hooks/useNotifications';

interface TaskManagerProps {
  projectId: string;
  userId: string;
  onClose?: () => void;
  compact?: boolean;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  color: #111827;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const AddButton = styled.button`
  appearance: none;
  background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #8b5cf6, #22d3ee);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  border: 2px solid transparent;
  color: #111827;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: box-shadow 0.2s ease, transform 0.05s ease, background-color 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(rgba(0, 122, 204, 0.08), rgba(0, 122, 204, 0.08)) padding-box,
                linear-gradient(135deg, #0090FF, #7c3aed) border-box;
  }

  &:active { transform: translateY(1px); }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #6b7280;
  padding: 4px;
  cursor: pointer;
  border-radius: 6px;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const StatsContainer = styled.div`
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
`;

const FiltersContainer = styled.div`
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
`;

const KanbanBoard = styled.div<{ compact?: boolean }>`
  display: flex;
  flex: 1;
  gap: ${props => props.compact ? '8px' : '12px'};
  padding: ${props => props.compact ? '8px' : '12px'};
  overflow-x: auto;
  min-height: 0;
`;

const ColumnContainer = styled.div<{ compact?: boolean }>`
  min-width: ${props => props.compact ? '120px' : '200px'};
  flex: 1;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
  text-align: center;
  
  p {
    margin: 8px 0;
    font-size: 14px;
  }
`;

export const TaskManager: React.FC<TaskManagerProps> = ({ projectId, userId, onClose, compact = false }) => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'created'>('created');

  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks
  } = useTasks(projectId, userId);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onAddTask: () => setShowTaskForm(true),
    onRefresh: refreshTasks
  });

  // Notifications for deadlines
  useNotifications(tasks);

  // Filter and sort tasks
  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'created':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Group tasks by status for Kanban view
  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    'in-progress': filteredTasks.filter(task => task.status === 'in-progress'),
    completed: filteredTasks.filter(task => task.status === 'completed')
  };

  // Compute stats from the full tasks list so the top counters reflect actual tasks
  const computedStats = {
    todo: tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  } as const;

  const handleCreateTask = useCallback(async (data: TaskFormData) => {
    try {
      await createTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: data.deadline,
      });
      setShowTaskForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [createTask]);

  const handleUpdateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, updates);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }, [updateTask]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }, [deleteTask]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      await handleUpdateTask(taskId, { status: newStatus });
    }
  }, [tasks, handleUpdateTask]);

  if (loading && tasks.length === 0) {
    return (
      <Container>
        <Header>
          <Title>Task Manager</Title>
          {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
        </Header>
        <EmptyState>
          <p>Loading tasks...</p>
        </EmptyState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Task Manager</Title>
          {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
        </Header>
        <EmptyState>
          <p>Error loading tasks: {error}</p>
          <button onClick={refreshTasks}>Retry</button>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Task Manager</Title>
        <HeaderActions>
          <AddButton onClick={() => setShowTaskForm(true)}>
            + New Task
          </AddButton>
          {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
        </HeaderActions>
      </Header>

      <StatsContainer>
        <TaskStats stats={computedStats} />
      </StatsContainer>

      <FiltersContainer>
        <TaskFilters
          statusFilter={filterStatus}
          priorityFilter={filterPriority}
          sortBy={sortBy}
          onStatusFilterChange={setFilterStatus}
          onPriorityFilterChange={setFilterPriority}
          onSortChange={setSortBy}
        />
      </FiltersContainer>

      <DndContext onDragEnd={handleDragEnd}>
        <KanbanBoard compact={compact}>
          <ColumnContainer compact={compact}>
            <TaskColumn
              title="To Do"
              status="todo"
              tasks={tasksByStatus.todo}
              onTaskClick={setEditingTask}
              onTaskDelete={handleDeleteTask}
              emptyMessage="No tasks to do"
              compact={compact}
            />
          </ColumnContainer>
          <ColumnContainer compact={compact}>
            <TaskColumn
              title="In Progress"
              status="in-progress"
              tasks={tasksByStatus['in-progress']}
              onTaskClick={setEditingTask}
              onTaskDelete={handleDeleteTask}
              emptyMessage="No tasks in progress"
              compact={compact}
            />
          </ColumnContainer>
          <ColumnContainer compact={compact}>
            <TaskColumn
              title="Completed"
              status="completed"
              tasks={tasksByStatus.completed}
              onTaskClick={setEditingTask}
              onTaskDelete={handleDeleteTask}
              emptyMessage="No completed tasks"
              compact={compact}
            />
          </ColumnContainer>
        </KanbanBoard>
      </DndContext>

      {showTaskForm && (
        <TaskForm
          task={null}
          onSubmit={handleCreateTask}
          onCancel={() => setShowTaskForm(false)}
        />
      )}

      {editingTask && (
        <TaskForm
          task={editingTask}
          onSubmit={(updates) => handleUpdateTask(editingTask.id, updates)}
          onCancel={() => setEditingTask(null)}
        />
      )}
    </Container>
  );
};
