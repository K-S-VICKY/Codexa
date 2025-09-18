import { useEffect, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { Editor } from './Editor';
import { File, RemoteFile, Type } from './external/editor/utils/file-manager';
import { useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Output } from './Output';
import { TerminalComponent as Terminal } from './Terminal';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from './Button';
import axios from 'axios';

function useSocket(replId: string) {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(`ws://${replId}.davish.tech`, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
            forceNew: true
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [replId]);

    return socket;
}

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
    const socket = useSocket(replId);
    const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    const [showOutput, setShowOutput] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('loaded', ({ rootContent }: { rootContent: RemoteFile[]}) => {
                setLoaded(true);
                setFileStructure(rootContent);
            });
        }
    }, [socket]);

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
                        variant={showOutput ? "secondary" : "primary"} 
                        size="sm"
                        onClick={() => setShowOutput(!showOutput)}
                    >
                        {showOutput ? 'Hide Output' : 'Show Output'}
                    </Button>
                </ButtonContainer>
            </Header>
            <Workspace>
                <LeftPanel>
                    {socket && <Editor socket={socket} selectedFile={selectedFile} onSelect={onSelect} files={fileStructure} />}
                </LeftPanel>
                <RightPanel>
                    {showOutput && <Output />}
                    {socket && <Terminal socket={socket} />}
                </RightPanel>
            </Workspace>
        </Container>
    );
}
