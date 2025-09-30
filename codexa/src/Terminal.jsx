import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const WS_URL = 'ws://localhost:3001';

const TerminalComponent = () => {
  const xtermRef = useRef(null);
  const fitAddon = useRef(new FitAddon());

  useEffect(() => {
    const term = new Terminal({
      fontSize: 16,
      theme: {
        background: '#23272e',
      },
    });
    term.loadAddon(fitAddon.current);
    term.open(xtermRef.current);
    fitAddon.current.fit();

    const socket = new WebSocket(WS_URL);

    // Terminal -> Server
    term.onData(data => {
      socket.send(data);
    });

    // Server -> Terminal
    socket.onmessage = (event) => {
      term.write(event.data);
    };

    // Clean up
    return () => {
      term.dispose();
      socket.close();
    };
  }, []);

  return (
    <div
      ref={xtermRef}
      style={{ width: '100%', height: '100%', background: '#23272e', borderRadius: '0 0 12px 12px' }}
    />
  );
};

export default TerminalComponent; 