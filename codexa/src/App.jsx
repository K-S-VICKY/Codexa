import React, { useEffect, useMemo, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import './App.css';

const languages = [
  { value: 'c', label: 'C' },
  { value: 'javascript', label: 'Node.js (JavaScript)' },
  { value: 'python', label: 'Python' }
];

function App() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // Pomodoro state
  const presetOptions = useMemo(() => [15, 20, 25, 30, 45, 60], []);
  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(selectedMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [autoCycle, setAutoCycle] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState(5);

  // simple beep using Web Audio API
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880; // A5
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      o.start(now);
      o.stop(now + 0.4);
    } catch {}
  };

  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const ensureNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  };
  const showDesktopNotification = (title, body) => {
    if (!notifyEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body });
    } catch {}
  };

  // Load saved settings on mount
  useEffect(() => {
    try {
      const savedDuration = localStorage.getItem('pomodoro.selectedMinutes');
      const savedBreak = localStorage.getItem('pomodoro.breakMinutes');
      const savedAuto = localStorage.getItem('pomodoro.autoCycle');
      const savedNotify = localStorage.getItem('pomodoro.notifyEnabled');
      if (savedDuration) setSelectedMinutes(Number(savedDuration));
      if (savedBreak) setBreakMinutes(Number(savedBreak));
      if (savedAuto) setAutoCycle(savedAuto === 'true');
      if (savedNotify) setNotifyEnabled(savedNotify === 'true');
    } catch {}
  }, []);

  // Persist settings when they change
  useEffect(() => {
    try {
      localStorage.setItem('pomodoro.selectedMinutes', String(selectedMinutes));
      localStorage.setItem('pomodoro.breakMinutes', String(breakMinutes));
      localStorage.setItem('pomodoro.autoCycle', String(autoCycle));
      localStorage.setItem('pomodoro.notifyEnabled', String(notifyEnabled));
    } catch {}
  }, [selectedMinutes, breakMinutes, autoCycle, notifyEnabled]);

  // Keep secondsLeft in sync when duration changes and not running
  useEffect(() => {
    if (!isRunning && !isBreak) {
      setSecondsLeft(selectedMinutes * 60);
    }
  }, [selectedMinutes, isRunning, isBreak]);

  // Countdown timer effect
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // play sound on session end
          playBeep();
          // handle session end
          if (autoCycle) {
            // auto switch without modal
            if (!isBreak) {
              // work -> break
              showDesktopNotification('Time for a break', `Take ${Math.max(1, Number(breakMinutes) || 5)} minutes`);
              setIsBreak(true);
              setSecondsLeft(Math.max(1, Number(breakMinutes) || 5) * 60);
              setIsRunning(true);
            } else {
              // break -> work
              showDesktopNotification('Break finished', 'Back to work!');
              setIsBreak(false);
              setSecondsLeft(selectedMinutes * 60);
              setIsRunning(true);
            }
            return 0; // will be immediately replaced above
          } else {
            // show modal as before
            setIsRunning(false);
            setShowModal(true);
            showDesktopNotification(isBreak ? 'Break finished' : 'Time is up', isBreak ? 'Ready to get back to work?' : 'Take a short break or continue');
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, autoCycle, isBreak, selectedMinutes, breakMinutes]);

  const formattedTime = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [secondsLeft]);

  const handleStartPause = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setSecondsLeft(selectedMinutes * 60);
    setShowModal(false);
  };

  const handleModalBreak = () => {
    // Start a short break
    setIsBreak(true);
    setShowModal(false);
    setSecondsLeft(Math.max(1, Number(breakMinutes) || 5) * 60);
    setIsRunning(true);
  };

  const handleModalContinue = () => {
    // Continue anyway: restart same interval
    setShowModal(false);
    setIsRunning(true);
    setSecondsLeft(selectedMinutes * 60);
    setIsBreak(false);
  };

  const runCode = async () => {
    setLoading(true);
    setOutput('');
    try {
      const res = await fetch('http://localhost:3001/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      const data = await res.json();
      setOutput(data.output);
    } catch (err) {
      setOutput('Error connecting to backend.');
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-left">Codexa</div>
        <div className="navbar-timer">
          <label className="auto-cycle">
            <input
              type="checkbox"
              checked={autoCycle}
              onChange={e => setAutoCycle(e.target.checked)}
            />
            Auto-cycle
          </label>
          <label className="auto-cycle">
            <input
              type="checkbox"
              checked={notifyEnabled}
              onChange={async e => {
                const next = e.target.checked;
                if (next) {
                  const ok = await ensureNotificationPermission();
                  setNotifyEnabled(ok);
                } else {
                  setNotifyEnabled(false);
                }
              }}
            />
            Notifications
          </label>
          <label className="break-input">
            Break (min)
            <input
              type="number"
              min="1"
              max="60"
              value={breakMinutes}
              onChange={e => setBreakMinutes(Number(e.target.value))}
            />
          </label>
          <select
            value={selectedMinutes}
            onChange={e => setSelectedMinutes(Number(e.target.value))}
            className="timer-select"
          >
            {presetOptions.map(min => (
              <option key={min} value={min}>{min} min</option>
            ))}
          </select>
          <div className={`timer-display${isBreak ? ' break' : ''}`}>{formattedTime}</div>
          <button className="timer-btn" onClick={handleStartPause}>{isRunning ? 'Pause' : 'Start'}</button>
          <button className="timer-btn secondary" onClick={handleReset}>Reset</button>
        </div>
        <div className="navbar-right">
          <button className="logout-btn">Logout</button>
      </div>
      </nav>
      <main className="editor-container">
        <div className="editor-square">
          <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0 8px 0', gap: 12 }}>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={{ padding: 4, borderRadius: 4 }}>
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
            <button onClick={runCode} disabled={loading} style={{ padding: '6px 18px', borderRadius: 4, background: '#5e3083', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              {loading ? 'Running...' : 'Run'}
        </button>
          </div>
          <div className="monaco-editor-wrapper">
            <MonacoEditor
              height="100%"
              width="100%"
              language={language === 'c' ? 'c' : language}
              value={code}
              onChange={value => setCode(value)}
              theme="vs-dark"
            />
          </div>
          <div className="output-terminal">
            <div className="output-title">Output Terminal</div>
            <pre className="output-content">{output}</pre>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-title">{isBreak ? 'Break finished' : 'Time is up'}</div>
            <div className="modal-body">
              {isBreak ? 'Ready to get back to work?' : 'Take a short break or continue?'}
            </div>
            <div className="modal-actions">
              {!isBreak && <button className="timer-btn" onClick={handleModalBreak}>Start 5-min Break</button>}
              <button className="timer-btn secondary" onClick={handleModalContinue}>{isBreak ? 'Continue Work' : 'Continue Anyway'}</button>
            </div>
          </div>
        </div>
      )}
      </div>
  );
}

export default App;
