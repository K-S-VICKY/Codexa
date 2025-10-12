import React from 'react';
import styled from '@emotion/styled';
import { useDroppable } from '@dnd-kit/core';
import { Task, TaskStatus } from '../types/task';
import { TaskCard } from './TaskCard';

interface TaskColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  emptyMessage: string;
  compact?: boolean;
}

const Column = styled.div<{ compact?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: ${props => props.compact ? '200px' : '400px'};
`;

const ColumnHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const ColumnTitle = styled.h4`
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
`;

const TaskCount = styled.span`
  background: #eef2ff;
  color: #3730a3;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
`;

const TaskList = styled.div<{ isDraggingOver: boolean }>`
  flex: 1;
  padding: 4px;
  border-radius: 8px;
  background: ${props => props.isDraggingOver ? '#f3f4f6' : 'transparent'};
  transition: background-color 0.2s ease;
  min-height: 100px;
`;

const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #6b7280;
  font-size: 12px;
  text-align: center;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  margin: 4px 0;
`;

export const TaskColumn: React.FC<TaskColumnProps> = ({
  title,
  status,
  tasks,
  onTaskClick,
  onTaskDelete,
  emptyMessage,
  compact = false
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <Column compact={compact}>
      <ColumnHeader>
        <ColumnTitle>{title}</ColumnTitle>
        <TaskCount>{tasks.length}</TaskCount>
      </ColumnHeader>
      
      <TaskList
        ref={setNodeRef}
        isDraggingOver={isOver}
      >
        {tasks.length === 0 ? (
          <EmptyMessage>{emptyMessage}</EmptyMessage>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onDelete={() => onTaskDelete(task.id)}
              compact={compact}
            />
          ))
        )}
      </TaskList>
    </Column>
  );
};
