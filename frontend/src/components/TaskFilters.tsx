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
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Select = styled.select`
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 4px 8px;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
  min-width: 100px;
  
  &:focus {
    outline: none;
    border-color: #007acc;
  }
  
  option {
    background: #1e1e1e;
    color: #ffffff;
  }
`;

const ClearFiltersButton = styled.button`
  background: transparent;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 4px 8px;
  color: #cccccc;
  font-size: 12px;
  cursor: pointer;
  margin-top: 16px;
  align-self: flex-start;
  
  &:hover {
    background: #333;
    border-color: #555;
  }
`;

const FilterChips = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const FilterChip = styled.span<{ active: boolean }>`
  background: ${props => props.active ? '#007acc' : '#333'};
  color: ${props => props.active ? '#ffffff' : '#cccccc'};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.active ? '#007acc' : '#555'};
  
  &:hover {
    background: ${props => props.active ? '#005a9e' : '#444'};
  }
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
