import { useEffect, useMemo, useState } from "react";
import Sidebar from "./external/editor/components/sidebar";
import { Code } from "./external/editor/editor/code";
import styled from "@emotion/styled";
import { File, buildFileTree, RemoteFile } from "./external/editor/utils/file-manager";
import { FileTree } from "./external/editor/components/file-tree";
import { Socket } from "socket.io-client";
import { InputDialog } from "./InputDialog";

// credits - https://codesandbox.io/s/monaco-tree-pec7u
export const Editor = ({
    files,
    onSelect,
    selectedFile,
    socket,
    onRefresh
}: {
    files: RemoteFile[];
    onSelect: (file: File) => void;
    selectedFile: File | undefined;
    socket: Socket;
    onRefresh?: () => void;
}) => {
  const rootDir = useMemo(() => {
    return buildFileTree(files);
  }, [files]);
  
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      onSelect(rootDir.files[0])
    }
  }, [selectedFile])

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
    <div>
      <Main>
        <Sidebar
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRefresh={onRefresh}
        >
          <FileTree
            rootDir={rootDir}
            selectedFile={selectedFile}
            onSelect={onSelect}
            socket={socket}
            onRefresh={onRefresh}
          />
        </Sidebar>
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
    </div>
  );
};

const Main = styled.main`
  display: flex;
`;