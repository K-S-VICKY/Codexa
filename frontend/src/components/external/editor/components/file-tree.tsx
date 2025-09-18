import React, {useState, useEffect} from 'react'
import {Directory, File, sortDir, sortFile, Type} from "../utils/file-manager";
import {getIcon} from "./icon";
import styled from "@emotion/styled";
import { ContextMenu, ContextMenuItem } from '../../../ContextMenu';
import { InputDialog } from '../../../InputDialog';
import { Socket } from 'socket.io-client';

interface FileTreeProps {
  rootDir: Directory;   // 根目录
  selectedFile: File | undefined;   // 当前选中文件
  onSelect: (file: File) => void;  // 更改选中时触发事件
  socket?: Socket; // Add socket for file operations
  onRefresh?: () => void; // Callback to refresh file tree
}

export const FileTree = (props: FileTreeProps) => {
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, file?: File | Directory} | null>(null);
  const [inputDialog, setInputDialog] = useState<{type: 'file' | 'folder' | 'rename', parentPath?: string, file?: File | Directory} | null>(null);

  const handleContextMenu = (e: React.MouseEvent, file?: File | Directory) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  const getContextMenuItems = (file?: File | Directory): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];
    
    if (!file) {
      // Root context menu
      items.push(
        { label: 'New File', icon: '📄', onClick: () => setInputDialog({type: 'file', parentPath: ''}) },
        { label: 'New Folder', icon: '📁', onClick: () => setInputDialog({type: 'folder', parentPath: ''}) }
      );
    } else {
      if (file.type === Type.Directory) { // Directory
        items.push(
          { label: 'New File', icon: '📄', onClick: () => setInputDialog({type: 'file', parentPath: file.path}) },
          { label: 'New Folder', icon: '📁', onClick: () => setInputDialog({type: 'folder', parentPath: file.path}) },
          { separator: true }
        );
      }
      items.push(
        { label: 'Rename', icon: '✏️', onClick: () => setInputDialog({type: 'rename', file}) },
        { label: 'Delete', icon: '🗑️', onClick: () => handleDelete(file) }
      );
    }
    
    return items;
  };

  const handleCreateFile = async (name: string) => {
    if (!props.socket) return;
    
    const parentPath = inputDialog?.parentPath || '';
    const filePath = parentPath ? `${parentPath}/${name}` : name;
    
    props.socket.emit('createFile', { path: filePath }, (response: {success: boolean, error?: string}) => {
      if (response.success) {
        props.onRefresh?.();
      } else {
        alert(`Failed to create file: ${response.error}`);
      }
    });
    
    setInputDialog(null);
  };

  const handleCreateFolder = async (name: string) => {
    if (!props.socket) return;
    
    const parentPath = inputDialog?.parentPath || '';
    const folderPath = parentPath ? `${parentPath}/${name}` : name;
    
    props.socket.emit('createFolder', { path: folderPath }, (response: {success: boolean, error?: string}) => {
      if (response.success) {
        props.onRefresh?.();
      } else {
        alert(`Failed to create folder: ${response.error}`);
      }
    });
    
    setInputDialog(null);
  };

  const handleRename = async (newName: string) => {
    if (!props.socket || !inputDialog?.file) return;
    
    const file = inputDialog.file;
    const pathParts = file.path.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');
    
    props.socket.emit('renameFile', { oldPath: file.path, newPath }, (response: {success: boolean, error?: string}) => {
      if (response.success) {
        props.onRefresh?.();
      } else {
        alert(`Failed to rename: ${response.error}`);
      }
    });
    
    setInputDialog(null);
  };

  const handleDelete = async (file: File | Directory) => {
    if (!props.socket) return;
    
    const confirmMessage = file.type === Type.Directory 
      ? `Are you sure you want to delete the folder "${file.name}" and all its contents?`
      : `Are you sure you want to delete the file "${file.name}"?`;
    
    if (confirm(confirmMessage)) {
      props.socket.emit('deleteFile', { path: file.path }, (response: {success: boolean, error?: string}) => {
        if (response.success) {
          props.onRefresh?.();
        } else {
          alert(`Failed to delete: ${response.error}`);
        }
      });
    }
  };

  const handleInputDialogConfirm = (value: string) => {
    if (!inputDialog) return;
    
    switch (inputDialog.type) {
      case 'file':
        handleCreateFile(value);
        break;
      case 'folder':
        handleCreateFolder(value);
        break;
      case 'rename':
        handleRename(value);
        break;
    }
  };

  return (
    <Container onContextMenu={(e) => handleContextMenu(e)}>
      <SubTree directory={props.rootDir} {...props} onContextMenu={handleContextMenu} />
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.file)}
          onClose={() => setContextMenu(null)}
        />
      )}
      
      <InputDialog
        isOpen={!!inputDialog}
        title={
          inputDialog?.type === 'file' ? 'New File' :
          inputDialog?.type === 'folder' ? 'New Folder' :
          'Rename'
        }
        placeholder={
          inputDialog?.type === 'file' ? 'Enter file name...' :
          inputDialog?.type === 'folder' ? 'Enter folder name...' :
          'Enter new name...'
        }
        initialValue={inputDialog?.type === 'rename' ? inputDialog.file?.name : ''}
        onConfirm={handleInputDialogConfirm}
        onCancel={() => setInputDialog(null)}
      />
    </Container>
  );
};

interface SubTreeProps {
  directory: Directory;   // 根目录
  selectedFile: File | undefined;   // 当前选中文件
  onSelect: (file: File) => void;  // 更改选中时触发事件
  onContextMenu: (e: React.MouseEvent, file?: File | Directory) => void;
}

const SubTree = (props: SubTreeProps) => {
  return (
    <div>
      {
        props.directory.dirs
          .sort(sortDir)
          .map(dir => (
            <React.Fragment key={dir.id}>
              <DirDiv
                directory={dir}
                selectedFile={props.selectedFile}
                onSelect={props.onSelect}
                onContextMenu={(e) => props.onContextMenu(e, dir)}/>
            </React.Fragment>
          ))
      }
      {
        props.directory.files
          .sort(sortFile)
          .map(file => (
            <React.Fragment key={file.id}>
              <FileDiv
                file={file}
                selectedFile={props.selectedFile}
                onClick={() => props.onSelect(file)}
                onContextMenu={(e) => props.onContextMenu(e, file)}/>
            </React.Fragment>
          ))
      }
    </div>
  )
}

const FileDiv = ({file, icon, selectedFile, onClick, onContextMenu}: {
  file: File | Directory; // 当前文件
  icon?: string;          // 图标名称
  selectedFile: File | undefined;     // 选中的文件
  onClick: () => void;    // 点击事件
  onContextMenu: (e: React.MouseEvent) => void;
}) => {
  const isSelected = (selectedFile && selectedFile.id === file.id) as boolean;
  const depth = file.depth;
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      path: file.path,
      name: file.name,
      type: file.type
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Only allow drop on directories
    if (file.type === Type.Directory) { // Directory
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (file.type !== Type.Directory) return; // Only allow drop on directories
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const sourcePath = dragData.path;
      const fileName = dragData.name;
      const targetPath = file.path ? `${file.path}/${fileName}` : fileName;
      
      // Don't allow dropping on itself or moving to same location
      if (sourcePath === targetPath || sourcePath === file.path) return;
      
      // Get socket from props (we'll need to pass it down)
      const socket = (window as any).currentSocket;
      if (socket) {
        socket.emit('moveFile', { sourcePath, targetPath }, (response: {success: boolean, error?: string}) => {
          if (response.success) {
            // Refresh file tree
            const refreshCallback = (window as any).refreshFileTree;
            refreshCallback?.();
          } else {
            alert(`Failed to move file: ${response.error}`);
          }
        });
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <Div
      depth={depth}
      isSelected={isSelected}
      isDragOver={isDragOver}
      onClick={onClick}
      onContextMenu={onContextMenu}
      draggable={true}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <FileIcon
        name={icon}
        extension={file.name.split('.').pop() || ""}/>
      <span style={{marginLeft: 1}}>
        {file.name}
      </span>
    </Div>
  )
}

const Div = styled.div<{
  depth: number;
  isSelected: boolean;
  isDragOver: boolean;
}>`
  display: flex;
  align-items: center;
  padding-left: ${props => props.depth * 16}px;
  background-color: ${props => props.isSelected ? "#242424" : props.isDragOver ? "#333" : "transparent"};

  :hover {
    cursor: pointer;
    background-color: #242424;
  }
`

const DirDiv = ({directory, selectedFile, onSelect, onContextMenu}: {
  directory: Directory;  // 当前目录
  selectedFile: File | undefined;    // 选中的文件
  onSelect: (file: File) => void;  // 点击事件
  onContextMenu: (e: React.MouseEvent, file?: File | Directory) => void;
}) => {
  let defaultOpen = false;
  if (selectedFile)
    defaultOpen = isChildSelected(directory, selectedFile)
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <FileDiv
        file={directory}
        icon={open ? "openDirectory" : "closedDirectory"}
        selectedFile={selectedFile}
        onClick={() => {
          if (!open) {
            onSelect(directory)
          }
          setOpen(!open)
        }}
        onContextMenu={(e) => onContextMenu(e, directory)}/>
      {
        open ? (
          <SubTree
            directory={directory}
            selectedFile={selectedFile}
            onSelect={onSelect}
            onContextMenu={onContextMenu}/>
        ) : null
      }
    </>
  )
}

const isChildSelected = (directory: Directory, selectedFile: File) => {
  let res: boolean = false;

  function isChild(dir: Directory, file: File) {
    if (selectedFile.parentId === dir.id) {
      res = true;
      return;
    }
    if (selectedFile.parentId === '0') {
      res = false;
      return;
    }
    dir.dirs.forEach((item) => {
      isChild(item, file);
    })
  }

  isChild(directory, selectedFile);
  return res;
}

const FileIcon = ({extension, name}: { name?: string, extension?: string }) => {
  let icon = getIcon(extension || "", name || "");
  return (
    <Span>
      {icon}
    </Span>
  )
}

const Span = styled.span`
  display: flex;
  width: 32px;
  height: 32px;
  justify-content: center;
  align-items: center;
`

const Container = styled.div`
  height: 100%;
  overflow-y: auto;
`;
