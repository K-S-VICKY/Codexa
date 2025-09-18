import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { saveToS3 } from "./aws";
import { fetchDir, fetchFileContent, saveFile } from "./fs";
import { SimpleTerminalManager } from "./pty-simple";

const terminalManager = new SimpleTerminalManager();

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

        // Send initial data
        try {
            socket.emit("loaded", {
                rootContent: await fetchDir("/workspace", "")
            });
        } catch (error) {
            console.error("Error loading workspace:", error);
            socket.emit("loaded", { rootContent: [] });
        }

        initHandlers(socket, replId);

        // Handle disconnection cleanup
        socket.on("disconnect", (reason) => {
            console.log(`Socket ${socket.id} disconnected: ${reason}`);
            terminalManager.clear(socket.id);
        });

        // Handle connection errors
        socket.on("error", (error) => {
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

}