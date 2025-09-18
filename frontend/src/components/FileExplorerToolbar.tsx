import React from 'react';
import styled from '@emotion/styled';

interface FileExplorerToolbarProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
}

export const FileExplorerToolbar: React.FC<FileExplorerToolbarProps> = ({
  onNewFile,
  onNewFolder,
  onRefresh
}) => {
  return (
    <Toolbar>
      <Title>Explorer</Title>
      <Actions>
        <ActionButton onClick={onNewFile} title="New File">
          📄
        </ActionButton>
        <ActionButton onClick={onNewFolder} title="New Folder">
          📁
        </ActionButton>
        <ActionButton onClick={onRefresh} title="Refresh">
          🔄
        </ActionButton>
      </Actions>
    </Toolbar>
  );
};

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(45, 45, 48, 0.8);
  border-bottom: 1px solid #454545;
  color: #cccccc;
  font-size: 13px;
  font-weight: 600;
`;

const Title = styled.span`
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: #cccccc;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:active {
    background: rgba(255, 255, 255, 0.2);
  }
`;
