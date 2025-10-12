import { useEffect, useRef, useState } from "react"
import { Socket } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';

const fitAddon = new FitAddon();

function ab2str(buf: ArrayBuffer) {
    return String.fromCharCode(...new Uint8Array(buf));
}

const OPTIONS_TERM = {
    cursorBlink: true,
    cols: 80,
    rows: 24,
    convertEol: true,
    allowTransparency: false,
    scrollback: 5000,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    fontSize: 14,
    lineHeight: 1.2,
    theme: {
        background: "#1e1e1e",
        foreground: "#ffffff",
        cursor: "#ffffff",
        selection: "#3a3d41",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#e5e5e5"
    }
};

export const TerminalComponent = ({ socket }: {socket: Socket}) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<Terminal | null>(null);
    const [isTerminalReady, setIsTerminalReady] = useState(false);

    useEffect(() => {
        if (!terminalRef || !terminalRef.current || !socket) {
            return;
        }

        // Create terminal instance
        const term = new Terminal(OPTIONS_TERM);
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        
        // Wait for DOM to be ready before fitting
        setTimeout(() => {
            try {
                fitAddon.fit();
            } catch (error) {
                console.warn('Terminal fit failed:', error);
            }
        }, 100);
        
        termRef.current = term;
        setIsTerminalReady(true);

        // Terminal data handler
        function terminalHandler({ data }: { data: ArrayBuffer | string }) {
            if (termRef.current) {
                let str: string;
                if (data instanceof ArrayBuffer) {
                    str = ab2str(data);
                } else if (typeof data === 'string') {
                    str = data;
                } else {
                    // Handle Buffer or other data types
                    str = String(data);
                }
                console.log('Terminal data:', str);
                termRef.current.write(str);
                try {
                    termRef.current.scrollToBottom();
                } catch {}
            }
        }

        // Handle user input
        term.onData((data) => {
            if (socket.connected) {
                socket.emit('terminalData', { data });
            }
        });

        // Socket event handlers
        const handleConnect = () => {
            console.log('Terminal: Socket connected, requesting terminal');
            socket.emit("requestTerminal");
            // Send initial newline to activate terminal
            setTimeout(() => {
                if (socket.connected) {
                    socket.emit('terminalData', { data: '\n' });
                }
            }, 100);
        };

        const handleDisconnect = () => {
            console.log('Terminal: Socket disconnected');
            if (termRef.current) {
                termRef.current.write('\r\n\x1b[31mConnection lost. Reconnecting...\x1b[0m\r\n');
            }
        };

        const handleReconnect = () => {
            console.log('Terminal: Socket reconnected, requesting new terminal');
            if (termRef.current) {
                termRef.current.write('\r\n\x1b[32mReconnected!\x1b[0m\r\n');
            }
            socket.emit("requestTerminal");
        };

        // Attach socket event listeners
        socket.on("terminal", terminalHandler);
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("reconnect", handleReconnect);

        // If already connected, request terminal immediately
        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off("terminal", terminalHandler);
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("reconnect", handleReconnect);
            
            if (termRef.current) {
                termRef.current.dispose();
                termRef.current = null;
            }
            setIsTerminalReady(false);
        }
    }, [socket]);

    // Refit terminal on container and window resize to keep sizing in sync with panel
    useEffect(() => {
        const onResize = () => {
            try {
                fitAddon.fit();
            } catch {}
        };
        window.addEventListener('resize', onResize);
        let observer: ResizeObserver | undefined;
        if (terminalRef.current && 'ResizeObserver' in window) {
            observer = new ResizeObserver(() => onResize());
            observer.observe(terminalRef.current);
        }
        return () => {
            window.removeEventListener('resize', onResize);
            if (observer && terminalRef.current) observer.unobserve(terminalRef.current);
        };
    }, []);

    return (
        <div style={{ width: "100%", height: "100%", minHeight: 0, textAlign: "left", display: 'flex' }} ref={terminalRef}>
            {!isTerminalReady && (
                <div style={{color: '#888', padding: '10px'}}>
                    Initializing terminal...
                </div>
            )}
        </div>
    );
}