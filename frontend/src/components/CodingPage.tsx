import { useEffect, useState } from 'react';
import { Editor } from './Editor';
import { File, RemoteFile, Type } from './external/editor/utils/file-manager';
import { useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { TerminalComponent } from './Terminal';
import { PortSelector } from './PortSelector';
import { useSocket } from '../hooks/useSocket';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatusIndicator = styled.div<{ connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.connected ? '#10b981' : '#f59e0b'};
  font-size: 14px;
  font-weight: 500;
`;

const StatusDot = styled.div<{ connected: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? '#10b981' : '#f59e0b'};
  animation: ${props => props.connected ? 'none' : 'pulse 2s infinite'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Workspace = styled.div`
  display: flex;
  flex: 1;
  margin: 0;
  font-size: 16px;
  width: 100%;
  min-height: 0;
`;

const LeftPanel = styled.div`
  flex: 1;
  width: 60%;
  background: rgba(15, 23, 42, 0.4);
  border-right: 1px solid rgba(148, 163, 184, 0.1);
`;

const RightPanel = styled.div`
  flex: 1;
  width: 40%;
  background: rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
`;

export const CodingPage = () => {
    const [podCreated, setPodCreated] = useState(false);
    const [searchParams] = useSearchParams();
    const replId = searchParams.get('replId') ?? '';
    
    useEffect(() => {
        if (replId) {
            axios.post(`http://localhost:3002/start`, { replId })
                .then(() => setPodCreated(true))
                .catch((err) => console.error(err));
        }
    }, []);

    if (!podCreated) {
        return (
            <LoadingSpinner 
                variant="fullscreen" 
                text="Booting your environment..." 
                subText="Setting up your containerized development workspace. This may take a few moments."
            />
        );
    }
    return <CodingPagePostPodCreation />
}

export const CodingPagePostPodCreation = () => {
    const [searchParams] = useSearchParams();
    const replId = searchParams.get('replId') ?? '';
    const [loaded, setLoaded] = useState(false);
    const { socket } = useSocket(replId);
    const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    const [showPortSelector, setShowPortSelector] = useState(false);
    const [selectedPort, setSelectedPort] = useState<number>(3000);
    
    // Get user info from localStorage or context
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [projectId, setProjectId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (socket) {
            socket.on('loaded', ({ rootContent }: { rootContent: RemoteFile[]}) => {
                setLoaded(true);
                setFileStructure(rootContent);
            });
        }
    }, [socket]);

    useEffect(() => {
        // Get user info from localStorage
        const token = localStorage.getItem('codexa_jwt');
        const userInfo = localStorage.getItem('codexa_user');
        
        if (token) {
            if (userInfo) {
                try {
                    const user = JSON.parse(userInfo);
                    setUserId(user.id || user._id || 'mock-user-id');
                } catch (error) {
                    console.error('Failed to parse user info:', error);
                    setUserId('mock-user-id');
                }
            } else {
                // Fallback to mock user ID if user info is not available
                setUserId('mock-user-id');
            }
        }
        
        // For now, use replId as projectId - in a real app, you'd fetch the project details
        setProjectId(replId);
    }, [replId]);

    const refreshFileStructure = () => {
        if (socket) {
            socket.emit("fetchDir", "", (data: RemoteFile[]) => {
                setFileStructure(data);
            });
        }
    };

    const onSelect = (file: File) => {
        if (file.type === Type.DIRECTORY) {
            socket?.emit("fetchDir", file.path, (data: RemoteFile[]) => {
                setFileStructure(prev => {
                    const allFiles = [...prev, ...data];
                    return allFiles.filter((file, index, self) => 
                        index === self.findIndex(f => f.path === file.path)
                    );
                });
            });
        } else {
            socket?.emit("fetchContent", { path: file.path }, (data: string) => {
                file.content = data;
                setSelectedFile(file);
            });
        }
    };
    
    if (!loaded) {
        return (
            <Container>
                <Header>
                    <Logo>Codexa</Logo>
                    <StatusIndicator connected={false}>
                        <StatusDot connected={false} />
                        Connecting...
                    </StatusIndicator>
                </Header>
                <LoadingSpinner 
                    variant="wave" 
                    text="Loading workspace..." 
                    subText="Syncing files and establishing connection"
                />
            </Container>
        );
    }

    return (
        <Container>
            <Header>
                <Logo>Codexa</Logo>
                <ButtonContainer>
                    <StatusIndicator connected={true}>
                        <StatusDot connected={true} />
                        Connected
                    </StatusIndicator>
                    <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => setShowPortSelector(true)}
                    >
                        Open Port in New Tab
                    </Button>
                </ButtonContainer>
            </Header>
            <Workspace>
                <LeftPanel>
                    {socket && (
                        <Editor 
                            socket={socket} 
                            selectedFile={selectedFile} 
                            onSelect={onSelect} 
                            onRefresh={refreshFileStructure} 
                            files={fileStructure}
                            projectId={projectId}
                            userId={userId}
                        />
                    )}
                </LeftPanel>
                <RightPanel>
                    {socket && <TerminalComponent socket={socket} />}
                </RightPanel>
            </Workspace>
            <PortSelector
                isOpen={showPortSelector}
                onClose={() => setShowPortSelector(false)}
                onSelectPort={(port) => {
                    setSelectedPort(port);
                    // Open port in new tab
                    const url = `http://${replId}-${port}.vigneshks.tech`;
                    window.open(url, '_blank');
                }}
                currentPort={selectedPort}
            />
        </Container>
    );
}
