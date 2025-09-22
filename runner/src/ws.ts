import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { saveToS3, createFolderInS3, deleteFromS3, deleteFolderFromS3 } from "./aws";
import { fetchDir, fetchFileContent, saveFile } from "./fs";
import { SimpleTerminalManager } from "./pty-simple";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as net from "net";

const terminalManager = new SimpleTerminalManager();

// Check if a port is available locally (i.e., if a service is running on it)
async function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        console.log(`[PORT-UTIL] Testing port ${port} availability...`);
        const server = net.createServer();
        let resolved = false;
        
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                console.log(`[PORT-UTIL] Port ${port} test timed out (500ms) - assuming service is running`);
                server.close();
                resolve(false); // Port is busy/in use
            }
        }, 500);
        
        server.listen(port, 'localhost', () => {
            if (!resolved) {
                resolved = true;
                console.log(`[PORT-UTIL] Port ${port} is available (no service running)`);
                clearTimeout(timeout);
                server.close(() => {
                    resolve(true); // Port is available
                });
            }
        });
        
        server.on('error', (err: any) => {
            if (!resolved) {
                resolved = true;
                console.log(`[PORT-UTIL] Port ${port} is busy - service detected (${err.code})`);
                clearTimeout(timeout);
                resolve(false); // Port is busy/in use
            }
        });
    });
}

// File system watcher to sync terminal-created files
function setupFileWatcher(replId: string) {
    const workspaceDir = '/workspace';
    
    if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
    }
    
    // Debounce map to prevent excessive sync operations
    const debounceMap = new Map<string, NodeJS.Timeout>();
    
    const watcher = fs.watch(workspaceDir, { recursive: true }, async (eventType, filename) => {
        if (!filename) return;
        
        // Skip temporary files and common build artifacts
        if (filename.includes('.tmp') || filename.includes('node_modules') || 
            filename.includes('.git') || filename.startsWith('.')) {
            return;
        }
        
        // Debounce file operations to prevent excessive S3 calls
        const debounceKey = filename;
        if (debounceMap.has(debounceKey)) {
            clearTimeout(debounceMap.get(debounceKey)!);
        }
        
        debounceMap.set(debounceKey, setTimeout(async () => {
            try {
                const fullPath = path.join(workspaceDir, filename);
                const relativePath = filename;
                
                // Check if file/directory exists
                if (fs.existsSync(fullPath)) {
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isFile() && stats.size < 1024 * 1024) { // Only sync files < 1MB
                        // Sync file to S3
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        await saveToS3(`code/${replId}/`, relativePath, content);
                        console.log(`Synced file to S3: ${relativePath}`);
                    } else if (stats.isDirectory()) {
                        // Sync folder to S3
                        await createFolderInS3(`code/${replId}/`, relativePath);
                        console.log(`Synced folder to S3: ${relativePath}`);
                    }
                }
            } catch (error) {
                console.error(`Error syncing file ${filename}:`, error);
            } finally {
                debounceMap.delete(debounceKey);
            }
        }, 1000)); // 1 second debounce
    });
    
    return watcher;
}

// Global connection tracking
let connectionCount = 0;
let totalConnections = 0;
const connectionStats = new Map<string, { connectTime: number, lastActivity: number }>();

// Periodic health monitoring to detect patterns
setInterval(() => {
    const now = Date.now();
    console.log(`[HEALTH] Active connections: ${connectionCount}, Total served: ${totalConnections}`);
    
    // Check for stale connections (no activity for 5+ minutes)
    for (const [socketId, stats] of connectionStats.entries()) {
        const inactiveTime = now - stats.lastActivity;
        const sessionTime = now - stats.connectTime;
        
        if (inactiveTime > 300000) { // 5 minutes
            console.warn(`[HEALTH] Stale connection detected: ${socketId}, inactive for ${Math.round(inactiveTime/1000)}s`);
        }
        
        // Log connections approaching 2 minutes (potential crash point)
        if (sessionTime > 110000 && sessionTime < 130000) { // 110-130 seconds
            console.warn(`[HEALTH] Connection approaching 2min mark: ${socketId}, session: ${Math.round(sessionTime/1000)}s`);
        }
    }
    
    // Log memory usage
    const memUsage = process.memoryUsage();
    console.log(`[HEALTH] Memory: ${Math.round(memUsage.heapUsed/1024/1024)}MB used, ${Math.round(memUsage.rss/1024/1024)}MB RSS`);
}, 60000); // Every minute

export function initWs(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:5173", 
                "http://localhost:3000", 
                "https://localhost:5173",
                /^https?:\/\/.*\.davish\.tech$/,
                /^https?:\/\/.*\.vigneshks\.tech$/
            ],
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type"],
            credentials: true
        },
        allowEIO3: true,
        transports: ['websocket', 'polling'],
        pingTimeout: 120000, // Increased from 60s to 120s
        pingInterval: 30000,  // Increased from 25s to 30s
        upgradeTimeout: 60000, // Increased from 30s to 60s
        maxHttpBufferSize: 1e6,
        connectTimeout: 60000
    });
      
    io.on("connection", async (socket) => {
        connectionCount++;
        totalConnections++;
        const connectTime = Date.now();
        
        // Auth checks should happen here
        const host = socket.handshake.headers.host;
        console.log(`[SOCKET] New connection #${totalConnections}: ${socket.id}, host: ${host}`);
        console.log(`[SOCKET] Active connections: ${connectionCount}`);
        
        // Split the host by '.' and take the first part as replId
        const replId = host?.split('.')[0];
        
        connectionStats.set(socket.id, { connectTime, lastActivity: connectTime });
    
        if (!replId) {
            socket.disconnect();
            terminalManager.clear(socket.id);
            return;
        }

        // Set up file system watcher
        const watcher = setupFileWatcher(replId);

        // Send initial data
        try {
            socket.emit("loaded", {
                rootContent: await fetchDir("/workspace", "")
            });
        } catch (error: any) {
            console.error("Error loading workspace:", error);
            socket.emit("loaded", { rootContent: [] });
        }

        initHandlers(socket, replId);

        // Handle disconnection cleanup
        socket.on("disconnect", (reason) => {
            connectionCount--;
            const stats = connectionStats.get(socket.id);
            const sessionDuration = stats ? Date.now() - stats.connectTime : 0;
            
            console.log(`[SOCKET] Disconnect: ${socket.id}, reason: ${reason}`);
            console.log(`[SOCKET] Session duration: ${Math.round(sessionDuration / 1000)}s`);
            console.log(`[SOCKET] Remaining connections: ${connectionCount}`);
            
            connectionStats.delete(socket.id);
            
            try {
                terminalManager.clear(socket.id);
            } catch (error) {
                console.error(`Error clearing terminal for ${socket.id}:`, error);
            }
            try {
                watcher.close();
            } catch (error) {
                console.error(`Error closing file watcher for ${socket.id}:`, error);
            }
        });

        // Handle connection errors
        socket.on("error", (error: any) => {
            console.error(`Socket ${socket.id} error:`, error);
        });
    });
}

function initHandlers(socket: Socket, replId: string) {

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    socket.on("fetchDir", async (dir: string, callback) => {
        const dirPath = `/workspace/${dir}`;
        const contents = await fetchDir(dirPath, dir);
        callback(contents);
    });

    socket.on("fetchContent", async ({ path: filePath }: { path: string }, callback) => {
        const fullPath = `/workspace/${filePath}`;
        const data = await fetchFileContent(fullPath);
        callback(data);
    });

    // TODO: contents should be diff, not full file
    // Should be validated for size
    // Should be throttled before updating S3 (or use an S3 mount)
    socket.on("updateContent", async ({ path: filePath, content }: { path: string, content: string }) => {
        const fullPath =  `/workspace/${filePath}`;
        await saveFile(fullPath, content);
        await saveToS3(`code/${replId}`, filePath, content);
    });

    socket.on("requestTerminal", async () => {
        terminalManager.createPty(socket.id, replId, (data, id) => {
            socket.emit('terminal', {
                data: data
            });
        });
    });
    
    socket.on("terminalData", async ({ data }: { data: string, terminalId: number }) => {
        terminalManager.write(socket.id, data);
    });

    // File operations
    socket.on("createFile", async ({ path, content = "" }: { path: string, content?: string }, callback) => {
        try {
            const fullPath = `/workspace/${path}`;
            await saveFile(fullPath, content);
            await saveToS3(`code/${replId}`, path, content);
            callback({ success: true });
        } catch (error: any) {
            console.error("Error creating file:", error);
            callback({ success: false, error: error.message });
        }
    });

    socket.on("createFolder", async ({ path }: { path: string }, callback) => {
        try {
            const fullPath = `/workspace/${path}`;
            const fs = require('fs').promises;
            await fs.mkdir(fullPath, { recursive: true });
            
            // Sync folder to R2/S3 by creating a .gitkeep placeholder
            await createFolderInS3(`code/${replId}/`, path);
            
            callback({ success: true });
        } catch (error: any) {
            console.error("Error creating folder:", error);
            callback({ success: false, error: error.message });
        }
    });

    socket.on("renameFile", async ({ oldPath, newPath }: { oldPath: string, newPath: string }, callback) => {
        try {
            const oldFullPath = `/workspace/${oldPath}`;
            const newFullPath = `/workspace/${newPath}`;
            const fs = require('fs').promises;
            await fs.rename(oldFullPath, newFullPath);
            
            // Update S3 if it's a file
            const stats = await fs.stat(newFullPath);
            if (stats.isFile()) {
                const content = await fs.readFile(newFullPath, 'utf-8');
                await saveToS3(`code/${replId}`, newPath, content);
            }
            
            callback({ success: true });
        } catch (error: any) {
            console.error("Error renaming file:", error);
            callback({ success: false, error: error.message });
        }
    });

    socket.on("deleteFile", async ({ path }: { path: string }, callback) => {
        try {
            console.log(`[DELETE] Starting deletion of: ${path}`);
            const fullPath = `/workspace/${path}`;
            const fs = require('fs').promises;
            
            // Check if file/folder exists
            try {
                await fs.access(fullPath);
            } catch {
                console.log(`[DELETE] File/folder not found locally: ${path}`);
                // Still try to delete from S3 in case it exists there
                await deleteFromS3(`code/${replId}/`, path);
                callback({ success: true });
                return;
            }
            
            const stats = await fs.stat(fullPath);
            
            // Delete from local filesystem
            if (stats.isDirectory()) {
                console.log(`[DELETE] Deleting directory: ${path}`);
                await fs.rmdir(fullPath, { recursive: true });
                // Delete folder from S3/R2
                console.log(`[DELETE] Deleting folder from S3: code/${replId}/${path}`);
                await deleteFolderFromS3(`code/${replId}/`, path);
                console.log(`[DELETE] Successfully deleted folder: ${path}`);
            } else {
                console.log(`[DELETE] Deleting file: ${path}`);
                await fs.unlink(fullPath);
                // Delete file from S3/R2
                console.log(`[DELETE] Deleting file from S3: code/${replId}/${path}`);
                await deleteFromS3(`code/${replId}/`, path);
                console.log(`[DELETE] Successfully deleted file: ${path}`);
            }
            
            callback({ success: true });
        } catch (error: any) {
            console.error(`[DELETE] Error deleting ${path}:`, error);
            callback({ success: false, error: error.message });
        }
    });

    socket.on("moveFile", async ({ sourcePath, targetPath }: { sourcePath: string, targetPath: string }, callback) => {
        try {
            const sourceFullPath = `/workspace/${sourcePath}`;
            const targetFullPath = `/workspace/${targetPath}`;
            const fs = require('fs').promises;
            
            // Check if source exists
            await fs.access(sourceFullPath);
            
            // Create target directory if it doesn't exist
            const targetDir = targetFullPath.substring(0, targetFullPath.lastIndexOf('/'));
            if (targetDir) {
                await fs.mkdir(targetDir, { recursive: true });
            }
            
            // Move the file/folder
            await fs.rename(sourceFullPath, targetFullPath);
            
            // Update S3 if it's a file
            const stats = await fs.stat(targetFullPath);
            if (stats.isFile()) {
                const content = await fs.readFile(targetFullPath, 'utf-8');
                await saveToS3(`code/${replId}`, targetPath, content);
            }
            
            callback({ success: true });
        } catch (error: any) {
            console.error("Error moving file:", error);
            callback({ success: false, error: error.message });
        }
    });

    // Port forwarding handlers
    socket.on("checkPort", async ({ port }: { port: number }, callback) => {
        try {
            const startTime = Date.now();
            console.log(`[PORT-CHECK] ========== PORT CHECK REQUEST ==========`);
            console.log(`[PORT-CHECK] Checking port: ${port}`);
            console.log(`[PORT-CHECK] Socket ID: ${socket.id}`);
            console.log(`[PORT-CHECK] Timestamp: ${new Date().toISOString()}`);
            
            const available = await isPortAvailable(port);
            const duration = Date.now() - startTime;
            
            console.log(`[PORT-CHECK] Port ${port} check completed in ${duration}ms`);
            console.log(`[PORT-CHECK] Port ${port} available: ${available}`);
            console.log(`[PORT-CHECK] ${available ? '❌ No service running' : '✅ Service detected'}`);
            console.log(`[PORT-CHECK] ==========================================`);
            
            // Update activity timestamp
            const stats = connectionStats.get(socket.id);
            if (stats) {
                stats.lastActivity = Date.now();
            }
            
            callback({ available, port });
        } catch (error: any) {
            console.error(`[PORT-CHECK] ❌ Error checking port ${port}:`, error);
            console.error(`[PORT-CHECK] Error stack:`, error.stack);
            callback({ available: false, port, error: error.message });
        }
    });

    socket.on("forwardPort", async ({ port }: { port: number }, callback) => {
        try {
            console.log(`[PORT] ========== PORT FORWARDING REQUEST ==========`);
            console.log(`[PORT] Requested port: ${port}`);
            console.log(`[PORT] Socket ID: ${socket.id}`);
            console.log(`[PORT] Timestamp: ${new Date().toISOString()}`);
            
            // Check if the target port is available (has a service running)
            console.log(`[PORT] Checking if service is running on port ${port}...`);
            const startTime = Date.now();
            const targetAvailable = await isPortAvailable(port);
            const checkDuration = Date.now() - startTime;
            
            console.log(`[PORT] Port check completed in ${checkDuration}ms`);
            console.log(`[PORT] Port ${port} available: ${targetAvailable}`);
            
            if (targetAvailable) {
                console.log(`[PORT] ❌ FAILED: No service running on port ${port}`);
                console.log(`[PORT] Suggestion: Start your dev server first (e.g., npm run dev)`);
                callback({ success: false, port, error: "No service running on target port" });
                return;
            }
            
            // Since the Kubernetes service already exposes these ports,
            // we don't need to create internal proxies. Just verify the service is running.
            const supportedPorts = [5173, 5174, 8000, 5000, 8080, 8081, 3000];
            console.log(`[PORT] Supported ports: ${supportedPorts.join(', ')}`);
            
            if (!supportedPorts.includes(port)) {
                console.log(`[PORT] ❌ FAILED: Port ${port} not in supported list`);
                callback({ success: false, port, error: `Port ${port} not supported. Supported ports: ${supportedPorts.join(', ')}` });
                return;
            }
            
            console.log(`[PORT] ✅ SUCCESS: Port ${port} is running and supported`);
            console.log(`[PORT] Kubernetes ingress will handle routing to: http://replId-${port}.domain.com`);
            console.log(`[PORT] ================================================`);
            
            // Port is running and supported - no proxy needed, Kubernetes handles routing
            callback({ success: true, port, message: "Port is accessible via Kubernetes ingress" });
        } catch (error: any) {
            console.error(`[PORT] ❌ CRITICAL ERROR setting up forwarding for port ${port}:`, error);
            console.error(`[PORT] Error stack:`, error.stack);
            callback({ success: false, port, error: error.message });
        }
    });

    socket.on("stopPortForward", async ({ port }: { port: number }, callback?) => {
        try {
            console.log(`[PORT] Stopping port forward for port ${port} from socket ${socket.id}`);
            // No cleanup needed since we're not using internal proxies
            // Just log for debugging purposes
            if (callback) {
                callback({ success: true, port });
            }
        } catch (error: any) {
            console.error(`[PORT] Error stopping port forward for port ${port}:`, error);
            if (callback) {
                callback({ success: false, port, error: error.message });
            }
        }
    });

    socket.on("killPort", async ({ port }: { port: number }, callback?) => {
        try {
            console.log(`[KILL-PORT] 🔪 Attempting to kill processes on port ${port} from socket ${socket.id}`);
            console.log(`[KILL-PORT] ================================================`);
            
            const { spawn } = require('child_process');
            const killProcess = spawn('bash', ['/workspace/kill-port.sh', port.toString()], {
                cwd: '/workspace'
            });
            
            let output = '';
            let errorOutput = '';
            
            killProcess.stdout.on('data', (data: Buffer) => {
                const message = data.toString();
                output += message;
                console.log(`[KILL-PORT] 📝 ${message.trim()}`);
            });
            
            killProcess.stderr.on('data', (data: Buffer) => {
                const message = data.toString();
                errorOutput += message;
                console.log(`[KILL-PORT] ⚠️ ${message.trim()}`);
            });
            
            killProcess.on('close', (code: number) => {
                console.log(`[KILL-PORT] Process exited with code ${code}`);
                console.log(`[KILL-PORT] ================================================`);
                
                if (code === 0) {
                    console.log(`[KILL-PORT] ✅ SUCCESS: Processes on port ${port} killed successfully`);
                    if (callback) {
                        callback({ 
                            success: true, 
                            port, 
                            message: `Successfully killed processes on port ${port}`,
                            output: output.trim()
                        });
                    }
                } else {
                    console.log(`[KILL-PORT] ❌ FAILED: Error killing processes on port ${port}`);
                    if (callback) {
                        callback({ 
                            success: false, 
                            port, 
                            error: `Failed to kill processes on port ${port}. Exit code: ${code}`,
                            output: errorOutput.trim()
                        });
                    }
                }
            });
            
        } catch (error: any) {
            console.error(`[KILL-PORT] ❌ CRITICAL ERROR killing processes on port ${port}:`, error);
            console.error(`[KILL-PORT] Error stack:`, error.stack);
            if (callback) {
                callback({ success: false, port, error: error.message });
            }
        }
    });

}