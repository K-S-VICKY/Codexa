import { useEffect, useRef, useState } from 'react';
import { Editor } from './Editor';
import { File, RemoteFile, Type } from './external/editor/utils/file-manager';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { TerminalComponent } from './Terminal';
import { PortSelector } from './PortSelector';
import { useSocket } from '../hooks/useSocket';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { LoadingOverlay } from './LoadingOverlay';
import { FiLogOut } from 'react-icons/fi';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #dbeafe 100%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
  flex: 2;
  width: 70%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: transparent;
  border-right: 1px solid rgba(148, 163, 184, 0.1);
`;

const RightPanel = styled.div`
  flex: 1;
  width: 30%;
  background: transparent;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
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
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  color: #1E293B;
  width: min(92vw, 520px);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #E5E7EB;
  border-bottom: 1px solid #D1D5DB;
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
  background: #FFFFFF;
  border: 1px solid #D1D5DB;
  color: #1E293B;
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

// Fullscreen helper
const enterFullscreen = async () => {
  try {
    const el: any = document.documentElement;
    if (document.fullscreenElement) return;
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return;
    }
    if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen();
      return;
    }
    if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
      return;
    }
  } catch {}
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
      <LoadingOverlay open={true} message="Booting your environment…" minDurationMs={3500} />
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
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

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

  // Download project as ZIP
  const downloadProject = async () => {
    try {
      setDownloading(true);
      // Load JSZip as an ES module (bundled by Vite)
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      // Helper to fetch file content via socket as Promise
      const fetchFileContent = (path: string) => new Promise<string>((resolve) => {
        socket?.emit('fetchContent', { path }, (data: string) => resolve(data ?? ''));
      });

      // Sanitize and normalize a path for ZIP entry (Windows-safe)
      const sanitizeZipPath = (p: string): string => {
        const project = replId || 'project';
        let rel = (p || '').trim();
        if (!rel) return `${project}/unnamed`;
        // Normalize separators and remove leading roots
        rel = rel.replace(/\\+/g, '/');
        rel = rel.replace(/^\/*/, '');
        // Replace illegal Windows filename characters in each segment
        rel = rel
          .split('/')
          .map(seg => seg.replace(/[<>:"|?*]/g, '_'))
          .filter(Boolean)
          .join('/');
        // Ensure project folder prefix
        if (!rel.startsWith(project + '/')) rel = `${project}/${rel}`;
        return rel;
      };

      // Ensure we have file listing; fetch if not yet available
      let allFiles = (fileStructure || []).filter((f) => f.type === 'file');
      if ((!allFiles || allFiles.length === 0) && socket) {
        allFiles = await new Promise<RemoteFile[]>((resolve) => {
          socket.emit('fetchDir', '', (data: RemoteFile[]) => {
            resolve((data || []).filter((f) => f.type === 'file'));
          });
        });
      }
      if (!allFiles || allFiles.length === 0) {
        throw new Error('No files found in project');
      }

      // Fetch all contents in parallel and add to zip preserving paths
      await Promise.all(allFiles.map(async (f) => {
        const content = await fetchFileContent(f.path);
        const entryPath = sanitizeZipPath(f.path || f.name);
        zip.file(entryPath, content, { binary: false });
      }));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${replId || 'project'}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      console.error('Failed to download project:', e);
      alert(`Failed to create ZIP. ${e instanceof Error ? e.message : ''}`);
    } finally {
      setDownloading(false);
    }
  };

  const confirmLogout = () => {
    // Clear authentication data
    localStorage.removeItem('codexa_jwt');
    localStorage.removeItem('codexa_user');
    // Reset session-specific UI state (quote shown on loading overlay)
    try { sessionStorage.removeItem('codexa_quote_index'); } catch {}
    
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

  // Import Project (folder picker)
  const handleClickImport = () => {
    folderInputRef.current?.click();
  };

  const ensureFolders = async (dirPath: string) => {
    if (!socket) return;
    const segments = dirPath.split('/').filter(Boolean);
    let cur = '';
    for (const seg of segments) {
      cur = cur ? `${cur}/${seg}` : seg;
      await new Promise<void>((resolve) => {
        socket.emit('createFolder', { path: cur }, () => resolve());
      });
    }
  };

  const importFolderFiles = async (fileList: FileList) => {
    if (!socket) return;
    setImporting(true);
    try {
      // Convert to array and sort by path depth so folders/files process deterministically
      const files = Array.from(fileList).filter(f => !!(f as any).webkitRelativePath);
      // Determine top folder to strip from paths
      const rootPrefix = files[0] ? (files[0] as any).webkitRelativePath.split('/')[0] : '';

      for (const f of files) {
        const webkitPath: string = (f as any).webkitRelativePath || f.name;
        // Strip the top-level folder name
        const relAfterRoot = webkitPath.startsWith(rootPrefix + '/') ? webkitPath.slice(rootPrefix.length + 1) : webkitPath;
        const normPath = relAfterRoot.replace(/\\+/g, '/');
        const dir = normPath.split('/').slice(0, -1).join('/');
        if (dir) {
          await ensureFolders(dir);
        }
        // Create file then write content
        await new Promise<void>((resolve) => {
          socket.emit('createFile', { path: normPath }, () => resolve());
        });
        const content = await f.text();
        await new Promise<void>((resolve) => {
          socket.emit('updateContent', { path: normPath, content }, () => resolve());
        });
      }
      refreshFileStructure();
      alert('Import completed');
    } catch (e) {
      console.error('Import failed:', e);
      alert('Import failed');
    } finally {
      setImporting(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
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
          <input
            type="file"
            ref={folderInputRef}
            style={{ display: 'none' }}
            // @ts-ignore - webkitdirectory is non-standard but supported in Chromium/Edge
            webkitdirectory=""
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                importFolderFiles(e.target.files);
              }
            }}
          />
          <Button variant="gradientOutline" size="sm" onClick={handleClickImport} disabled={importing}>
            {importing ? 'Importing…' : 'Import Project'}
          </Button>
          <Button variant="gradientOutline" size="sm" onClick={downloadProject} disabled={downloading}>
            {downloading ? 'Preparing Zip…' : 'Download Project'}
          </Button>
          <Button variant="gradientOutline" size="sm" onClick={() => setShowPortSelector(true)}>Open Port</Button>
          <Button variant="gradientOutline" size="sm" onClick={() => setShowPomodoro(true)}>Pomodoro</Button>
          <Button variant="gradientOutline" size="sm" onClick={async () => { await enterFullscreen(); setShowZen(true); }}>Zen Mode</Button>
          <Button variant="gradientOutline" size="sm" onClick={handleLogout}>
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
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            {socket && <TerminalComponent socket={socket} />}
          </div>
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
              <Button variant="gradientOutline" size="sm" onClick={() => setShowPomodoro(false)}>Close</Button>
            </ModalHeader>
            <ModalBody>
              {breakPromptOpen && (
                <div style={{ background:'#E5E7EB', border:'1px solid #D1D5DB', borderRadius:8, padding:12 }}>
                  <div style={{ marginBottom:8, fontWeight:700 }}>It's time for a break</div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <Button variant="gradientOutline" size="sm" onClick={() => { setIsRunning(true); }}>Wait till break is over</Button>
                    <Button variant="gradientOutline" size="sm" onClick={() => {
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
                <Button variant="gradientOutline" size="sm" onClick={() => { setBreakPromptOpen(false); startPause(); }}>{isRunning ? 'Pause' : 'Start'}</Button>
                <Button variant="gradientOutline" size="sm" onClick={reset}>Reset</Button>
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
              <Button variant="gradientOutline" size="sm" onClick={() => setShowZen(false)}>Close</Button>
            </ModalHeader>
            <ModalBody>
              <div style={{ marginBottom:12, fontWeight:700 }}>Choose Language Playlist 🎶</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
                {Object.keys(LANG_PLAYLISTS).map(lang => {
                  const active = lang===selectedLang;
                  return (
                    <Button
                      key={lang}
                      variant="gradientOutline"
                      size="sm"
                      onClick={()=>setSelectedLang(lang as keyof typeof LANG_PLAYLISTS)}
                      style={{
                        textTransform:'capitalize',
                        fontWeight:700,
                        opacity: active ? 1 : 0.9,
                        background: active ? 'linear-gradient(rgba(59,130,246,0.15), rgba(139,92,246,0.15))' : undefined,
                        borderColor: active ? '#3b82f6' : undefined,
                        boxShadow: active ? 'inset 0 0 0 2px rgba(59,130,246,0.25)' : undefined
                      }}
                      aria-pressed={active}
                    >
                      {lang}
                    </Button>
                  )
                })}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Button 
                  variant="gradientOutline" 
                  size="sm" 
                  onClick={() => {
                    setBackgroundPlaying(true);
                    setShowZen(false); // hide modal when play clicked
                  }}
                >
                  Play
                </Button>
                <Button 
                  variant="gradientOutline" 
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
              <Button variant="gradientOutline" size="sm" onClick={() => setShowLogoutConfirm(false)}>×</Button>
            </ModalHeader>
            <ModalBody>
              <div style={{ marginBottom: 16, color: '#1E293B' }}>
                Are you sure you want to logout? Any unsaved work will be lost.
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <Button variant="gradientOutline" size="sm" onClick={() => setShowLogoutConfirm(false)}>
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
          <button
            aria-label="Close Spotify player"
            onClick={() => setBackgroundPlaying(false)}
            style={{
              position:'absolute',
              top:-10,
              right:-10,
              width:28,
              height:28,
              borderRadius:16,
              background:'#111827',
              color:'#e2e8f0',
              border:'1px solid #374151',
              cursor:'pointer',
              boxShadow:'0 2px 6px rgba(0,0,0,0.25)'
            }}
          >
            ×
          </button>
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
