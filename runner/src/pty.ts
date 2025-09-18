//@ts-ignore => someone fix this
import { fork, IPty } from 'node-pty';

const SHELL = "bash";

export class TerminalManager {
    private sessions: { [id: string]: {terminal: IPty, replId: string;} } = {};

    constructor() {
        this.sessions = {};
        console.log("TerminalManager initialized");
        
        // Verify node-pty is working at startup
        try {
            console.log("Verifying node-pty availability...");
            const testPty = fork('echo', ['test'], { cols: 80, rows: 24 });
            testPty.kill();
            console.log("✓ node-pty verification successful");
        } catch (error) {
            console.error("✗ FATAL: node-pty verification failed:", error);
            throw new Error(`node-pty initialization failed: ${error}`);
        }
    }
    
    createPty(id: string, replId: string, onData: (data: string, id: number) => void) {
        console.log(`Creating PTY session - ID: ${id}, ReplID: ${replId}`);
        
        // Clean up existing session if it exists
        if (this.sessions[id]) {
            console.log(`Cleaning up existing terminal session for ${id}`);
            try {
                this.sessions[id].terminal.kill();
            } catch (error) {
                console.error("Error killing existing terminal:", error);
            }
            delete this.sessions[id];
        }

        try {
            console.log(`Forking shell: ${SHELL} in /workspace`);
            let term = fork(SHELL, [], {
                cols: 100,
                rows: 30,
                name: 'xterm-256color',
                cwd: `/workspace`,
                env: {
                    ...process.env,
                    TERM: 'xterm-256color',
                    COLORTERM: 'truecolor'
                }
            });

            console.log(`PTY created successfully - PID: ${term.pid}`);

            term.on('data', (data: string) => {
                try {
                    onData(data, term.pid);
                } catch (error) {
                    console.error(`Error in terminal data handler for ${id}:`, error);
                }
            });

            term.on('exit', (code: number, signal: string) => {
                console.log(`Terminal ${id} exited with code ${code}, signal ${signal}`);
                delete this.sessions[id];
            });

            term.on('error', (error: Error) => {
                console.error(`Terminal ${id} error:`, error);
                delete this.sessions[id];
            });

            this.sessions[id] = {
                terminal: term,
                replId
            };

            console.log(`✓ Created terminal session ${id} for repl ${replId} (PID: ${term.pid})`);
            return term;
            
        } catch (error) {
            console.error(`✗ Failed to create PTY session ${id}:`, error);
            throw new Error(`PTY creation failed: ${error}`);
        }
    }

    write(terminalId: string, data: string) {
        if (this.sessions[terminalId]?.terminal) {
            try {
                this.sessions[terminalId].terminal.write(data);
                console.log(`Data written to terminal ${terminalId}: ${data.replace(/\r?\n/g, '\\n')}`);
            } catch (error) {
                console.error(`Error writing to terminal ${terminalId}:`, error);
            }
        } else {
            console.warn(`Terminal session ${terminalId} not found. Available sessions: ${Object.keys(this.sessions).join(', ')}`);
        }
    }

    clear(terminalId: string) {
        if (this.sessions[terminalId]) {
            try {
                const pid = this.sessions[terminalId].terminal.pid;
                this.sessions[terminalId].terminal.kill();
                console.log(`✓ Cleared terminal session ${terminalId} (PID: ${pid})`);
            } catch (error) {
                console.error(`Error killing terminal ${terminalId}:`, error);
            }
            delete this.sessions[terminalId];
        } else {
            console.log(`Terminal session ${terminalId} not found for cleanup`);
        }
    }

    getSessionInfo() {
        const sessionCount = Object.keys(this.sessions).length;
        const sessionIds = Object.keys(this.sessions);
        console.log(`Active terminal sessions: ${sessionCount} (${sessionIds.join(', ')})`);
        return { sessionCount, sessionIds };
    }
}
