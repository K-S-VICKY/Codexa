import React from 'react';
import styled from '@emotion/styled';
import { FileExplorerToolbar } from '../../../FileExplorerToolbar';

interface SidebarProps {
  children: React.ReactNode;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onRefresh?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ children, onNewFile, onNewFolder, onRefresh }) => {
  return (
    <Container>
      {(onNewFile || onNewFolder || onRefresh) && (
        <FileExplorerToolbar
          onNewFile={onNewFile || (() => {})}
          onNewFolder={onNewFolder || (() => {})}
          onRefresh={onRefresh || (() => {})}
        />
      )}
      <Content>
        {children}
      </Content>
    </Container>
  );
};

export default Sidebar;

const Container = styled.div`
  width: 300px;
  height: 100vh;
  background: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;
