import { useEffect, useState } from 'react';
import { Editor } from './Editor';
import { File, RemoteFile, Type } from './external/editor/utils/file-manager';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { TerminalComponent } from './Terminal';
import { PortSelector } from './PortSelector';
import { useSocket } from '../hooks/useSocket';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { FiLogOut } from 'react-icons/fi';
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

// Modal styles
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

// Language playlists
const LANG_PLAYLISTS: Record<string, string> = {
  telugu: "37i9dQZF1DWTt3gMo0DLxA",
  tamil: "37i9dQZF1DX4Im4BTs2WMg",
  english: "78WfVSixcwaxVMetGnA9k0",
  hindi: "37i9dQZF1DXbVhgADFy3im",
  marathi: "37i9dQZF1DX84EApEEEkUc",
  kannada: "37i9dQZF1DX1ahAlaaz0ZE"
};

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
  const navigate = useNavigate();
  const replId = searchParams.get('replId') ?? '';
  const { socket } = useSocket(replId);

  const [loaded, setLoaded] = useState(false);
  const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [showPortSelector, setShowPortSelector] = useState(false);
  const [selectedPort, setSelectedPort] = useState<number>(3000);

  // Pomodoro state
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [workMinutes, setWorkMinutes] = useState<number>(25);
  const [breakMinutes, setBreakMinutes] = useState<number>(5);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);
  const [breakPromptOpen, setBreakPromptOpen] = useState(false);

  // Zen Mode state
  const [showZen, setShowZen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<keyof typeof LANG_PLAYLISTS>('english');
  const [backgroundPlaying, setBackgroundPlaying] = useState(false);

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // user/project
  const [userId, setUserId] = useState<string | undefined>('mock-user-id');
  const [projectId, setProjectId] = useState<string | undefined>(replId);

  // Logout function
  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    // Clear authentication data
    localStorage.removeItem('codexa_jwt');
    localStorage.removeItem('codexa_user');
    
    // Navigate to login page
    navigate('/login');
  };

  useEffect(() => {
    if (socket) {
      socket.on('loaded', ({ rootContent }: { rootContent: RemoteFile[]}) => {
        setLoaded(true);
        setFileStructure(rootContent);
      });
    }
  }, [socket]);

  // Pomodoro logic
  useEffect(() => {
    if (!isRunning && !isBreak) setSecondsLeft(workMinutes * 60);
  }, [workMinutes, isRunning, isBreak]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setIsRunning(false);
          if (!isBreak) {
            setShowPomodoro(true);
            setIsBreak(true);
            setSecondsLeft(Math.max(1, breakMinutes) * 60);
            setBreakPromptOpen(true);
          } else {
            setIsBreak(false);
            setSecondsLeft(workMinutes * 60);
            setShowPomodoro(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, isBreak, workMinutes, breakMinutes]);

  const format = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const startPause = () => setIsRunning(v => !v);
  const reset = () => { setIsRunning(false); setIsBreak(false); setSecondsLeft(workMinutes * 60); setBreakPromptOpen(false); };

  const refreshFileStructure = () => {
    socket?.emit("fetchDir", "", (data: RemoteFile[]) => {
      setFileStructure(data);
    });
  };

  const onSelect = (file: File) => {
    if (file.type === Type.DIRECTORY) {
      socket?.emit("fetchDir", file.path, (data: RemoteFile[]) => {
        setFileStructure(prev => {
          const allFiles = [...prev, ...data];
          return allFiles.filter((f, i, self) => i === self.findIndex(ff => ff.path === f.path));
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
          <Button variant="primary" size="sm" onClick={() => setShowPortSelector(true)}>Open Port</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowPomodoro(true)}>Pomodoro</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowZen(true)}>Zen Mode</Button>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <FiLogOut style={{ marginRight: '6px' }} />
            Logout
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
          const url = `http://${replId}-${port}.vigneshks.tech`;
          window.open(url, '_blank');
        }}
        currentPort={selectedPort}
      />

      {/* Pomodoro Modal */}
      {showPomodoro && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <div>Pomodoro</div>
              <Button variant="secondary" size="sm" onClick={() => setShowPomodoro(false)}>Close</Button>
            </ModalHeader>
            <ModalBody>
              {breakPromptOpen && (
                <div style={{ background:'#1f2937', border:'1px solid #374151', borderRadius:8, padding:12 }}>
                  <div style={{ marginBottom:8, fontWeight:700 }}>It's time for a break</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <Button variant="primary" size="sm" onClick={() => { setIsRunning(true); }}>Wait till break is over</Button>
                    <Button variant="secondary" size="sm" onClick={() => {
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
                  <SmallInput type="number" value={workMinutes}
                    onChange={e => { setWorkMinutes(Math.max(1, Number(e.target.value) || 25)); if (!isRunning && !isBreak) setSecondsLeft((Math.max(1, Number(e.target.value) || 25)) * 60); }} />
                </label>
                <label>
                  Break (min)
                  <SmallInput type="number" value={breakMinutes}
                    onChange={e => { setBreakMinutes(Math.max(1, Number(e.target.value) || 5)); if (isBreak && !isRunning) setSecondsLeft((Math.max(1, Number(e.target.value) || 5)) * 60); }} />
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

      {/* Zen Mode Modal */}
      {showZen && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <div>Zen Mode (Spotify)</div>
              <Button variant="secondary" size="sm" onClick={() => setShowZen(false)}>Close</Button>
            </ModalHeader>
            <ModalBody>
              <div style={{ marginBottom:12, fontWeight:700 }}>Choose Language Playlist 🎶</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                {Object.keys(LANG_PLAYLISTS).map(lang => {
                  const active = lang===selectedLang;
                  return (
                    <button 
                      key={lang} 
                      onClick={()=>setSelectedLang(lang as keyof typeof LANG_PLAYLISTS)} 
                      style={{
                        padding:'6px 12px',
                        borderRadius:20,
                        border: active?'2px solid #22d3ee':'1px solid #374151',
                        background: active?'rgba(34,211,238,0.2)':'#1f2937',
                        color:'#e2e8f0',
                        cursor:'pointer',
                        fontWeight:700,
                        textTransform:'capitalize'
                      }}
                    >
                      {lang}
                    </button>
                  )
                })}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => {
                    setBackgroundPlaying(true);
                    setShowZen(false); // hide modal when play clicked
                  }}
                >
                  Play
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setBackgroundPlaying(false)}
                >
                  Pause
                </Button>
              </div>
            </ModalBody>
          </Modal>
        </ModalBackdrop>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <ModalBackdrop>
          <Modal>
            <ModalHeader>
              <div>Confirm Logout</div>
              <Button variant="secondary" size="sm" onClick={() => setShowLogoutConfirm(false)}>×</Button>
            </ModalHeader>
            <ModalBody>
              <div style={{ marginBottom: 16, color: '#e2e8f0' }}>
                Are you sure you want to logout? Any unsaved work will be lost.
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button variant="secondary" size="sm" onClick={() => setShowLogoutConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={confirmLogout}>
                  Logout
                </Button>
              </div>
            </ModalBody>
          </Modal>
        </ModalBackdrop>
      )}

      {/* Spotify player only shows when Play is clicked */}
      {backgroundPlaying && (
        <div style={{ position:'fixed', bottom:12, right:12, width:320, height:80, zIndex:900 }}>
          <iframe
            title="spotify-player"
            style={{ borderRadius: 8 }}
            src={`https://open.spotify.com/embed/playlist/${LANG_PLAYLISTS[selectedLang]}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      )}
    </Container>
  );
}
