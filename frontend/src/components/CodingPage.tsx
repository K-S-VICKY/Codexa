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

// Pomodoro modal styles
const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #0f172a;
  border: 1px solid rgba(148,163,184,0.15);
  color: #e2e8f0;
  width: min(92vw, 520px);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.35);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #111827;
  border-bottom: 1px solid rgba(148,163,184,0.12);
`;

const ModalBody = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const TimeDisplay = styled.div`
  font-size: 40px;
  font-weight: 800;
  letter-spacing: 2px;
`;

const SmallInput = styled.input`
  background: #1f2937;
  border: 1px solid #374151;
  color: #e5e7eb;
  padding: 6px 10px;
  border-radius: 8px;
  width: 80px;
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

    // Pomodoro state
    const [showPomodoro, setShowPomodoro] = useState(false);
    const [workMinutes, setWorkMinutes] = useState<number>(25);
    const [breakMinutes, setBreakMinutes] = useState<number>(5);
    const [autoCycle, setAutoCycle] = useState<boolean>(false);
    const [notifyEnabled, setNotifyEnabled] = useState<boolean>(false);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [isBreak, setIsBreak] = useState<boolean>(false);
    const [secondsLeft, setSecondsLeft] = useState<number>(workMinutes * 60);
    const [breakPromptOpen, setBreakPromptOpen] = useState<boolean>(false);

    const ensureNotificationPermission = async () => {
      if (!('Notification' in window)) return false;
      if (Notification.permission === 'granted') return true;
      if (Notification.permission === 'denied') return false;
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    };
    const notify = (title: string, body: string) => {
      if (!notifyEnabled) return;
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      try { new Notification(title, { body }); } catch {}
    };
    const beep = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t+0.01); g.gain.exponentialRampToValueAtTime(0.0001, t+0.35);
        o.start(t); o.stop(t+0.4);
      } catch {}
    };

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

    // sync seconds with workMinutes when idle on work sessions
    useEffect(() => {
      if (!isRunning && !isBreak) setSecondsLeft(workMinutes * 60);
    }, [workMinutes, isRunning, isBreak]);

    // countdown
    useEffect(() => {
      if (!isRunning) return;
      const id = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(id);
            setIsRunning(false);
            beep();
            if (!isBreak) {
              // Work finished -> open modal and prompt for break
              setShowPomodoro(true);
              setIsBreak(true);
              setSecondsLeft(Math.max(1, breakMinutes) * 60);
              setBreakPromptOpen(true);
              if (notifyEnabled) notify('Time for a break', `Take ${breakMinutes} minutes`);
              // Wait for user action via prompt buttons
            } else {
              // Break finished -> close modal and resume idle work state
              if (notifyEnabled) notify('Break finished', 'Back to work!');
              setIsBreak(false);
              setSecondsLeft(workMinutes * 60);
              setShowPomodoro(false);
              // stay paused until user starts again
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }, [isRunning, isBreak, workMinutes, breakMinutes, notifyEnabled]);

    const format = (s: number) => {
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      return `${m}:${sec}`;
    };

    const startPause = () => setIsRunning(v => !v);
    const reset = () => { setIsRunning(false); setIsBreak(false); setSecondsLeft(workMinutes * 60); setBreakPromptOpen(false); };

    const openNotifications = async () => {
      const ok = await ensureNotificationPermission();
      setNotifyEnabled(ok);
      if (!ok) {
        alert('Notifications are blocked by the browser. Please allow notifications for this site.');
      } else {
        alert('Desktop notifications enabled.');
      }
    };

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
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowPomodoro(true)}
                    >
                        Pomodoro
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

            {showPomodoro && (
              <ModalBackdrop>
                <Modal>
                  <ModalHeader>
                    <div>Pomodoro</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="secondary" size="sm" onClick={() => setShowPomodoro(false)}>Close</Button>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    {breakPromptOpen && (
                      <div style={{ background:'#1f2937', border:'1px solid #374151', borderRadius:8, padding:12 }}>
                        <div style={{ marginBottom:8, fontWeight:700 }}>It's time for a break</div>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          <Button variant="primary" size="sm" onClick={() => { setIsRunning(true); /* keep modal open */ }}>Wait till break is over</Button>
                          <Button variant="secondary" size="sm" onClick={() => {
                            // skip break and continue work
                            setIsBreak(false);
                            setSecondsLeft(workMinutes * 60);
                            setIsRunning(true);
                            setBreakPromptOpen(false);
                            setShowPomodoro(false);
                          }}>Continue</Button>
                        </div>
                      </div>
                    )}
                    <Row>
                      <label>
                        Work (min)
                        <SmallInput type="number" min={1} max={120} value={workMinutes}
                          onChange={e => { setWorkMinutes(Math.max(1, Number(e.target.value) || 25)); if (!isRunning && !isBreak) setSecondsLeft((Math.max(1, Number(e.target.value) || 25)) * 60); }} />
                      </label>
                      <label>
                        Break (min)
                        <SmallInput type="number" min={1} max={60} value={breakMinutes}
                          onChange={e => { setBreakMinutes(Math.max(1, Number(e.target.value) || 5)); if (isBreak && !isRunning) setSecondsLeft((Math.max(1, Number(e.target.value) || 5)) * 60); }} />
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={autoCycle} onChange={e => setAutoCycle(e.target.checked)} /> Auto-cycle
                      </label>
                    </Row>
                    <Row>
                      <TimeDisplay>{format(secondsLeft)}{isBreak ? ' (Break)' : ''}</TimeDisplay>
                    </Row>
                    <Row>
                      <Button variant="primary" size="sm" onClick={() => { setBreakPromptOpen(false); startPause(); }}>{isRunning ? 'Pause' : 'Start'}</Button>
                      <Button variant="secondary" size="sm" onClick={reset}>Reset</Button>
                    </Row>
                  </ModalBody>
                </Modal>
              </ModalBackdrop>
            )}
        </Container>
    );
}
