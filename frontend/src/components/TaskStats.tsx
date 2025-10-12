import React from 'react';
import styled from '@emotion/styled';
import { TaskStats as TaskStatsType } from '../types/task';

interface TaskStatsProps {
  stats: TaskStatsType;
}

const StatsContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  min-width: 60px;
`;

const StatValue = styled.span<{ color: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${props => props.color};
  line-height: 1;
`;

const StatLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-left: 16px;
`;

const ProgressFill = styled.div<{ percentage: number; color: string }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => props.color};
  transition: width 0.3s ease;
`;

const CompletionText = styled.span`
  font-size: 12px;
  color: #6b7280;
  margin-left: 8px;
`;

export const TaskStats: React.FC<TaskStatsProps> = ({ stats }) => {
  const total = stats.todo + stats['in-progress'] + stats.completed;
  const completionPercentage = total > 0 ? Math.round((stats.completed / total) * 100) : 0;

  const getCompletionColor = (percentage: number) => {
    if (percentage === 0) return '#9ca3af';
    if (percentage < 30) return '#ef4444';
    if (percentage < 70) return '#f59e0b';
    return '#10b981';
  };

  return (
    <StatsContainer>
      <StatItem>
        <StatValue color="#ff4757">{stats.todo}</StatValue>
        <StatLabel>To Do</StatLabel>
      </StatItem>
      
      <StatItem>
        <StatValue color="#ffa502">{stats['in-progress']}</StatValue>
        <StatLabel>In Progress</StatLabel>
      </StatItem>
      
      <StatItem>
        <StatValue color="#2ed573">{stats.completed}</StatValue>
        <StatLabel>Completed</StatLabel>
      </StatItem>

      {total > 0 && (
        <>
          <ProgressBar>
            <ProgressFill 
              percentage={completionPercentage} 
              color={getCompletionColor(completionPercentage)}
            />
          </ProgressBar>
          <CompletionText>{completionPercentage}% Complete</CompletionText>
        </>
      )}
    </StatsContainer>
  );
};
