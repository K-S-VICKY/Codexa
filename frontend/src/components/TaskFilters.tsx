import React from 'react';
import styled from '@emotion/styled';
import { TaskStatus, TaskPriority } from '../types/task';

interface TaskFiltersProps {
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
  sortBy: 'deadline' | 'priority' | 'created';
  onStatusFilterChange: (status: TaskStatus | 'all') => void;
  onPriorityFilterChange: (priority: TaskPriority | 'all') => void;
  onSortChange: (sort: 'deadline' | 'priority' | 'created') => void;
}

const FiltersContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterLabel = styled.label`
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Select = styled.select`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 10px;
  color: #111827;
  font-size: 12px;
  cursor: pointer;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: #c7d2fe;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  
  option {
    background: #ffffff;
    color: #111827;
  }
`;

const ClearFiltersButton = styled.button`
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
  margin-top: 16px;
  align-self: flex-start;
  transition: box-shadow 0.2s ease, transform 0.05s ease, background 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(rgba(0, 122, 204, 0.08), rgba(0, 122, 204, 0.08)) padding-box,
                linear-gradient(135deg, #0090FF, #7c3aed) border-box;
  }

  &:active { transform: translateY(1px); }
`;

const FilterChips = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const FilterChip = styled.span<{ active: boolean }>`
  background: ${props => props.active ? '#eef2ff' : '#f3f4f6'};
  color: ${props => props.active ? '#3730a3' : '#374151'};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  cursor: default;
  border: 1px solid ${props => props.active ? '#c7d2fe' : '#e5e7eb'};
`;

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  statusFilter,
  priorityFilter,
  sortBy,
  onStatusFilterChange,
  onPriorityFilterChange,
  onSortChange
}) => {
  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all';

  const clearAllFilters = () => {
    onStatusFilterChange('all');
    onPriorityFilterChange('all');
  };

  const getStatusDisplayName = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getPriorityDisplayName = (priority: TaskPriority) => {
    switch (priority) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      default: return priority;
    }
  };

  const getSortDisplayName = (sort: string) => {
    switch (sort) {
      case 'deadline': return 'Deadline';
      case 'priority': return 'Priority';
      case 'created': return 'Created';
      default: return sort;
    }
  };

  return (
    <div>
      <FiltersContainer>
        <FilterGroup>
          <FilterLabel>Status</FilterLabel>
          <Select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as TaskStatus | 'all')}
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Priority</FilterLabel>
          <Select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as TaskPriority | 'all')}
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Sort By</FilterLabel>
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'deadline' | 'priority' | 'created')}
          >
            <option value="created">Created Date</option>
            <option value="deadline">Deadline</option>
            <option value="priority">Priority</option>
          </Select>
        </FilterGroup>
      </FiltersContainer>

      {hasActiveFilters && (
        <>
          <FilterChips>
            {statusFilter !== 'all' && (
              <FilterChip active={true}>
                Status: {getStatusDisplayName(statusFilter as TaskStatus)}
              </FilterChip>
            )}
            {priorityFilter !== 'all' && (
              <FilterChip active={true}>
                Priority: {getPriorityDisplayName(priorityFilter as TaskPriority)}
              </FilterChip>
            )}
            <FilterChip active={true}>
              Sort: {getSortDisplayName(sortBy)}
            </FilterChip>
          </FilterChips>
          
          <ClearFiltersButton onClick={clearAllFilters}>
            Clear All Filters
          </ClearFiltersButton>
        </>
      )}
    </div>
  );
};
