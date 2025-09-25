import React, { useState } from 'react';
import styled from '@emotion/styled';
import { useDraggable } from '@dnd-kit/core';
import { Task, TaskPriority } from '../types/task';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete: () => void;
  compact?: boolean;
}

const Card = styled.div<{ compact?: boolean }>`
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: ${props => props.compact ? '8px' : '12px'};
  margin-bottom: ${props => props.compact ? '6px' : '8px'};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: #37373d;
    border-color: #007acc;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const TaskTitle = styled.h5`
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.3;
  flex: 1;
  margin-right: 8px;
`;

const PriorityBadge = styled.span<{ priority: TaskPriority }>`
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    switch (props.priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
    }
  }};
  color: white;
  flex-shrink: 0;
`;

const TaskDescription = styled.p`
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #cccccc;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TaskFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
`;

const Deadline = styled.div<{ isOverdue: boolean; isUpcoming: boolean }>`
  font-size: 11px;
  color: ${props => {
    if (props.isOverdue) return '#ff4757';
    if (props.isUpcoming) return '#ffa502';
    return '#999';
  }};
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${Card}:hover & {
    opacity: 1;
  }
`;

const ActionButton = styled.button<{ variant: 'edit' | 'delete' }>`
  background: ${props => props.variant === 'edit' ? '#007acc' : '#ff4757'};
  border: none;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: ${props => props.variant === 'edit' ? '#005a9e' : '#ff3742'};
  }
`;

const OverdueIndicator = styled.div`
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  height: 3px;
  background: linear-gradient(90deg, #ff4757, #ff3742);
  border-radius: 6px 6px 0 0;
`;

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDelete, compact = false }) => {
  const [showActions, setShowActions] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return null;
    
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
  const isUpcoming = task.deadline && !isOverdue && new Date(task.deadline).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...listeners}
      {...attributes}
      compact={compact}
    >
      {isOverdue && <OverdueIndicator />}
      
      <CardHeader>
        <TaskTitle>{task.title}</TaskTitle>
        <PriorityBadge priority={task.priority}>{task.priority}</PriorityBadge>
      </CardHeader>

      {task.description && (
        <TaskDescription>{task.description}</TaskDescription>
      )}

      <TaskFooter>
        {task.deadline && (
          <Deadline isOverdue={!!isOverdue} isUpcoming={!!isUpcoming}>
            {formatDeadline(task.deadline)}
          </Deadline>
        )}
        
        <ActionButtons style={{ opacity: showActions ? 1 : 0 }}>
          <ActionButton 
            variant="edit"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Edit
          </ActionButton>
          <ActionButton 
            variant="delete"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this task?')) {
                onDelete();
              }
            }}
          >
            Delete
          </ActionButton>
        </ActionButtons>
      </TaskFooter>
    </Card>
  );
};
