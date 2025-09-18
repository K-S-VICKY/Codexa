import { spawn, ChildProcess } from 'child_process';

const SHELL = "bash";

export class SimpleTerminalManager {
    private sessions: { [id: string]: { process: ChildProcess, replId: string } } = {};

    constructor() {
        this.sessions = {};
        console.log("SimpleTerminalManager initialized (using child_process)");
    }
    
    createPty(id: string, replId: string, onData: (data: string, id: number) => void) {
        console.log(`Creating simple terminal session - ID: ${id}, ReplID: ${replId}`);
        
        // Clean up existing session if it exists
        if (this.sessions[id]) {
            console.log(`Cleaning up existing terminal session for ${id}`);
            try {
                this.sessions[id].process.kill();
            } catch (error) {
                console.error("Error killing existing terminal:", error);
            }
            delete this.sessions[id];
        }

        try {
            console.log(`Spawning shell: ${SHELL} in /workspace`);
            const childProcess = spawn(SHELL, [], {
                cwd: '/workspace',
                env: {
                    ...process.env,
                    TERM: 'xterm-256color',
                    COLORTERM: 'truecolor',
                    PS1: '\\u@\\h:\\w$ '
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            console.log(`Process created successfully - PID: ${childProcess.pid}`);

            // Send initial welcome message and prompt
            setTimeout(() => {
                onData(`\x1b[32mTerminal ready!\x1b[0m\r\n`, childProcess.pid || 0);
                onData(`\x1b[36mWorkspace: /workspace\x1b[0m\r\n`, childProcess.pid || 0);
                // Send a command to show current directory and trigger prompt
                childProcess.stdin?.write('pwd\n');
            }, 100);

            // Handle stdout data
            childProcess.stdout?.on('data', (data: Buffer) => {
                try {
                    const output = data.toString();
                    console.log(`Terminal ${id} stdout:`, output.replace(/\r?\n/g, '\\n'));
                    onData(output, childProcess.pid || 0);
                } catch (error) {
                    console.error(`Error in terminal data handler for ${id}:`, error);
                }
            });

            // Handle stderr data
            childProcess.stderr?.on('data', (data: Buffer) => {
                try {
                    const output = data.toString();
                    console.log(`Terminal ${id} stderr:`, output.replace(/\r?\n/g, '\\n'));
                    onData(output, childProcess.pid || 0);
                } catch (error) {
                    console.error(`Error in terminal stderr handler for ${id}:`, error);
                }
            });

            childProcess.on('exit', (code: number | null, signal: string | null) => {
                console.log(`Terminal ${id} exited with code ${code}, signal ${signal}`);
                delete this.sessions[id];
            });

            childProcess.on('error', (error: Error) => {
                console.error(`Terminal ${id} error:`, error);
                delete this.sessions[id];
            });

            this.sessions[id] = {
                process: childProcess,
                replId
            };

            console.log(`✓ Created simple terminal session ${id} for repl ${replId} (PID: ${childProcess.pid})`);
            return childProcess;
            
        } catch (error) {
            console.error(`✗ Failed to create simple terminal session ${id}:`, error);
            throw new Error(`Simple terminal creation failed: ${error}`);
        }
    }

    write(terminalId: string, data: string) {
        if (this.sessions[terminalId]?.process?.stdin) {
            try {
                this.sessions[terminalId].process.stdin?.write(data);
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
                const pid = this.sessions[terminalId].process.pid;
                this.sessions[terminalId].process.kill();
                console.log(`✓ Cleared simple terminal session ${terminalId} (PID: ${pid})`);
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
        console.log(`Active simple terminal sessions: ${sessionCount} (${sessionIds.join(', ')})`);
        return { sessionCount, sessionIds };
    }
}
