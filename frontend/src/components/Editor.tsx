import { useEffect, useMemo, useState } from "react";
import { EnhancedSidebar } from "./external/editor/components/enhanced-sidebar";
import { Code } from "./external/editor/editor/code";
import styled from "@emotion/styled";
import { File, buildFileTree, RemoteFile } from "./external/editor/utils/file-manager";
import { FileTree } from "./external/editor/components/file-tree";
import { Socket } from "socket.io-client";
import { InputDialog } from "./InputDialog";
import { useSearchParams } from "react-router-dom";

// credits - https://codesandbox.io/s/monaco-tree-pec7u
export const Editor = ({
  files,
  onSelect,
  selectedFile,
  socket,
  onRefresh,
  projectId,
  userId
}: {
  files: RemoteFile[];
  onSelect: (file: File) => void;
  selectedFile: File | undefined;
  socket: Socket;
  onRefresh?: () => void;
  projectId?: string;
  userId?: string;
}) => {
  const rootDir = useMemo(() => {
    return buildFileTree(files);
  }, [files]);
  
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  useEffect(() => {
    if (!selectedFile && rootDir.files.length > 0) {
      onSelect(rootDir.files[0])
    }
  }, [selectedFile, rootDir.files])

  const handleNewFile = () => {
    setShowNewFileDialog(true);
  };

  const handleNewFolder = () => {
    setShowNewFolderDialog(true);
  };

  const handleCreateFile = (name: string) => {
    if (socket) {
      socket.emit('createFile', { path: name }, (response: {success: boolean, error?: string}) => {
        if (response.success) {
          onRefresh?.();
        } else {
          alert(`Failed to create file: ${response.error}`);
        }
      });
    }
    setShowNewFileDialog(false);
  };

  const handleCreateFolder = (name: string) => {
    if (socket) {
      socket.emit('createFolder', { path: name }, (response: {success: boolean, error?: string}) => {
        if (response.success) {
          onRefresh?.();
        } else {
          alert(`Failed to create folder: ${response.error}`);
        }
      });
    }
    setShowNewFolderDialog(false);
  };

  return (
    <EditorContainer>
      <Main>
        <EnhancedSidebar
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRefresh={onRefresh}
          projectId={projectId}
          userId={userId}
        >
          <FileTree
            rootDir={rootDir}
            selectedFile={selectedFile}
            onSelect={onSelect}
            socket={socket}
            onRefresh={onRefresh}
          />
        </EnhancedSidebar>
        <Code socket={socket} selectedFile={selectedFile} />
      </Main>
      
      <InputDialog
        isOpen={showNewFileDialog}
        title="New File"
        placeholder="Enter file name..."
        onConfirm={handleCreateFile}
        onCancel={() => setShowNewFileDialog(false)}
      />
      
      <InputDialog
        isOpen={showNewFolderDialog}
        title="New Folder"
        placeholder="Enter folder name..."
        onConfirm={handleCreateFolder}
        onCancel={() => setShowNewFolderDialog(false)}
      />
    </EditorContainer>
  );
};

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const Main = styled.main`
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
`;