import React, { useState } from 'react';
import styled from '@emotion/styled';
import { FileExplorerToolbar } from '../../../FileExplorerToolbar';
import { useSearchParams } from 'react-router-dom';

interface EnhancedSidebarProps {
  children: React.ReactNode;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onRefresh?: () => void;
  projectId?: string;
  userId?: string;
}

const Container = styled.div`
  width: 300px;
  height: 100vh;
  background: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2d2d30;
  border-bottom: 1px solid #3e3e42;
  padding: 12px 16px;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #cccccc;
`;

const TasksButton = styled.button`
  background: #007acc;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #005a9e;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({ 
  children, 
  onNewFile, 
  onNewFolder, 
  onRefresh,
  projectId,
  userId 
}) => {
  const [searchParams] = useSearchParams();

  const handleOpenTasks = () => {
    const replId = searchParams.get('replId');
    const tasksUrl = `/tasks${replId ? `?replId=${replId}` : ''}`;
    window.open(tasksUrl, '_blank');
  };

  const showFileToolbar = onNewFile || onNewFolder || onRefresh;

  return (
    <Container>
      <HeaderBar>
        <HeaderTitle>📁 Explorer</HeaderTitle>
        <TasksButton onClick={handleOpenTasks}>
          ✅ Tasks
        </TasksButton>
      </HeaderBar>

      <Content>
        {showFileToolbar && (
          <FileExplorerToolbar
            onNewFile={onNewFile || (() => {})}
            onNewFolder={onNewFolder || (() => {})}
            onRefresh={onRefresh || (() => {})}
          />
        )}
        {children}
      </Content>
    </Container>
  );
};
