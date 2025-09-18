import { useEffect, useRef, useState } from "react"
import { Socket } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';

const fitAddon = new FitAddon();

function ab2str(buf: ArrayBuffer) {
    return String.fromCharCode(...new Uint8Array(buf));
}

const OPTIONS_TERM = {
    useStyle: true,
    screenKeys: true,
    cursorBlink: true,
    cols: 200,
    theme: {
        background: "black"
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
        fitAddon.fit();
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

    return (
        <div style={{width: "40vw", height: "400px", textAlign: "left"}} ref={terminalRef}>
            {!isTerminalReady && (
                <div style={{color: '#888', padding: '10px'}}>
                    Initializing terminal...
                </div>
            )}
        </div>
    );
}