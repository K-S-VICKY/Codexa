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
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: ${props => props.compact ? '8px' : '12px'};
  margin-bottom: ${props => props.compact ? '6px' : '8px'};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: #c7d2fe;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
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
  font-weight: 700;
  color: #111827;
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

const DragHandle = styled.div`
  margin-left: 6px;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: #e5e7eb;
  display: inline-block;
  cursor: grab;
  flex-shrink: 0;
`;

const TaskDescription = styled.p`
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #374151;
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
    if (props.isOverdue) return '#b91c1c';
    if (props.isUpcoming) return '#b45309';
    return '#6b7280';
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
  appearance: none;
  ${props => props.variant === 'edit'
    ? `background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #8b5cf6, #22d3ee);`
    : `background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #f43f5e, #f59e0b);`}
  background-origin: border-box;
  background-clip: padding-box, border-box;
  border: 2px solid transparent;
  color: #111827;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.05s ease;

  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(rgba(0, 122, 204, 0.08), rgba(0, 122, 204, 0.08)) padding-box,
                ${props => props.variant === 'edit' 
                  ? 'linear-gradient(135deg, #0090FF, #7c3aed)'
                  : 'linear-gradient(135deg, #ef4444, #f59e0b)'} border-box;
  }

  &:active { transform: translateY(1px); }
`;

const OverdueIndicator = styled.div`
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  height: 3px;
  background: linear-gradient(90deg, #ef4444, #f43f5e);
  border-radius: 8px 8px 0 0;
`;

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDelete, compact = false }) => {
  const [showActions, setShowActions] = useState(false);
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
  } : undefined;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      compact={compact}
    >
      {task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed' && <OverdueIndicator />}
      
      <CardHeader>
        <TaskTitle>{task.title}</TaskTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PriorityBadge priority={task.priority}>{task.priority}</PriorityBadge>
          <DragHandle {...listeners} {...attributes} title="Drag" />
        </div>
      </CardHeader>

      {task.description && (
        <TaskDescription>{task.description}</TaskDescription>
      )}

      <TaskFooter>
        {task.deadline && (
          <Deadline isOverdue={!!(task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed')} isUpcoming={!!(task.deadline && !(task.deadline && new Date(task.deadline) < new Date()) && new Date(task.deadline).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000)}>
            {(() => {
              const deadline = task.deadline ? new Date(task.deadline) : undefined;
              if (!deadline) return null;
              const now = new Date();
              const diffTime = deadline.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
              if (diffDays === 0) return 'Due today';
              if (diffDays === 1) return 'Due tomorrow';
              if (diffDays <= 7) return `Due in ${diffDays} days`;
              return deadline.toLocaleDateString();
            })()}
          </Deadline>
        )}
        
        <ActionButtons style={{ opacity: showActions ? 1 : 0 }}>
          <ActionButton 
            variant="edit"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Edit
          </ActionButton>
          <ActionButton 
            variant="delete"
            onMouseDown={(e) => e.stopPropagation()}
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
