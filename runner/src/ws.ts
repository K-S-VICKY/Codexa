import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { saveToS3, createFolderInS3 } from "./aws";
import { fetchDir, fetchFileContent, saveFile } from "./fs";
import { SimpleTerminalManager } from "./pty-simple";
import * as fs from "fs";
import * as path from "path";

const terminalManager = new SimpleTerminalManager();

// File system watcher to sync terminal-created files
function setupFileWatcher(replId: string) {
    const workspaceDir = '/workspace';
    
    if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
    }
    
    const watcher = fs.watch(workspaceDir, { recursive: true }, async (eventType, filename) => {
        if (!filename) return;
        
        try {
            const fullPath = path.join(workspaceDir, filename);
            const relativePath = filename;
            
            // Check if file/directory exists
            if (fs.existsSync(fullPath)) {
                const stats = fs.statSync(fullPath);
                
                if (stats.isFile()) {
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
        }
    });
    
    return watcher;
}

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
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 30000,
        maxHttpBufferSize: 1e6
    });
      
    io.on("connection", async (socket) => {
        // Auth checks should happen here
        const host = socket.handshake.headers.host;
        console.log(`host is ${host}, socket id: ${socket.id}`);
        // Split the host by '.' and take the first part as replId
        const replId = host?.split('.')[0];
    
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
            console.log(`Socket ${socket.id} disconnected: ${reason}`);
            terminalManager.clear(socket.id);
            watcher.close();
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
            const fullPath = `/workspace/${path}`;
            const fs = require('fs').promises;
            const stats = await fs.stat(fullPath);
            
            if (stats.isDirectory()) {
                await fs.rmdir(fullPath, { recursive: true });
            } else {
                await fs.unlink(fullPath);
            }
            
            callback({ success: true });
        } catch (error: any) {
            console.error("Error deleting file:", error);
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

}