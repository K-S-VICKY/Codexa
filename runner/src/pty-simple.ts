import * as pty from '@lydell/node-pty';

const SHELL = "bash";

export class SimpleTerminalManager {
    private sessions: { [id: string]: { process: pty.IPty, replId: string } } = {};

    constructor() {
        this.sessions = {};
        console.log("SimpleTerminalManager initialized (using @lydell/node-pty)");
    }
    
    createPty(id: string, replId: string, onData: (data: string, id: number) => void) {
        console.log(`Creating simple terminal session - ID: ${id}, ReplID: ${replId}`);
        
        // Clean up existing session if it exists
        if (this.sessions[id]) {
            console.log(`Cleaning up existing terminal session for ${id}`);
            try {
                this.sessions[id].process.kill('SIGTERM');
                // Give it a moment to clean up
                setTimeout(() => {
                    if (this.sessions[id]) {
                        try {
                            this.sessions[id].process.kill('SIGKILL');
                        } catch (error) {
                            console.error("Error force killing terminal:", error);
                        }
                    }
                }, 1000);
            } catch (error) {
                console.error("Error killing existing terminal:", error);
            }
            delete this.sessions[id];
        }

        try {
            console.log(`Spawning shell: ${SHELL} in /workspace`);
            // Use @lydell/node-pty for true PTY functionality with interactive commands
            const childProcess = pty.spawn('bash', ['--login', '-i'], {
                name: 'xterm-256color',
                cols: 80,
                rows: 24,
                cwd: '/workspace',
                env: {
                    ...process.env,
                    TERM: 'xterm-256color',
                    COLORTERM: 'truecolor',
                    PS1: '\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ ',
                    HOME: '/workspace',
                    USER: 'coder',
                    SHELL: '/bin/bash',
                    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
                    // Force interactive/TTY mode for CLI tools
                    FORCE_COLOR: '1',
                    NPM_CONFIG_COLOR: 'always',
                    CLICOLOR: '1',
                    CLICOLOR_FORCE: '1'
                }
            });

            console.log(`Process created successfully - PID: ${childProcess.pid}`);

            // Send initial setup commands
            setTimeout(() => {
                onData(`\r\n\x1b[32mTerminal ready! Interactive mode enabled.\x1b[0m\r\n`, childProcess.pid || 0);
                onData(`\x1b[36mWorkspace: /workspace\x1b[0m\r\n`, childProcess.pid || 0);
                // Initialize with a simple command to show prompt
                childProcess.write('echo "Terminal initialized"\n');
            }, 500);

            // Handle PTY data output
            childProcess.onData((data: string) => {
                try {
                    console.log(`Terminal ${id} data:`, JSON.stringify(data));
                    onData(data, childProcess.pid || 0);
                } catch (error) {
                    console.error(`Error in terminal data handler for ${id}:`, error);
                }
            });

            childProcess.onExit(({ exitCode, signal }: { exitCode: number, signal?: number }) => {
                console.log(`Terminal ${id} exited with code ${exitCode}, signal ${signal}`);
                delete this.sessions[id];
                
                // Notify about unexpected exits
                if (exitCode !== 0 && signal !== 15) { // Not normal exit or SIGTERM
                    console.warn(`Terminal ${id} exited unexpectedly: code=${exitCode}, signal=${signal}`);
                    onData(`\r\n\x1b[31mTerminal session ended unexpectedly. Reconnecting...\x1b[0m\r\n`, 0);
                }
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
        if (this.sessions[terminalId]?.process) {
            try {
                // With @lydell/node-pty, we can write data directly without complex processing
                // PTY handles all the terminal control sequences properly
                this.sessions[terminalId].process.write(data);
                console.log(`Data written to terminal ${terminalId}:`, JSON.stringify(data));
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
                // Try graceful termination first
                this.sessions[terminalId].process.kill('SIGTERM');
                
                // Force kill after timeout if still running
                setTimeout(() => {
                    if (this.sessions[terminalId]) {
                        try {
                            this.sessions[terminalId].process.kill('SIGKILL');
                            console.log(`✓ Force killed PTY terminal session ${terminalId} (PID: ${pid})`);
                        } catch (error) {
                            console.error(`Error force killing terminal ${terminalId}:`, error);
                        }
                        delete this.sessions[terminalId];
                    }
                }, 2000);
                
                console.log(`✓ Cleared PTY terminal session ${terminalId} (PID: ${pid})`);
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
