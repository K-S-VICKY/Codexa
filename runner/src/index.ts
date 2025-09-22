import express from "express";
import { createServer } from "http";
import { initWs } from "./ws";
import cors from "cors";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: [
        "http://localhost:5173", 
        "http://localhost:3000", 
        "https://localhost:5173",
        /^https?:\/\/.*\.davish\.tech$/,
        /^https?:\/\/.*\.vigneshks\.tech$/
    ],
    credentials: true
}));

initWs(server);

// Enhanced health check with resource monitoring
app.get("/health", (req, res) => {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
        },
        cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
        },
        pid: process.pid
    });
});

// Add process monitoring and crash detection
let startTime = Date.now();
let crashCount = 0;

// Monitor memory usage every 30 seconds
setInterval(() => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    console.log(`[MONITOR] Uptime: ${Math.round(uptime)}s, Memory: ${memUsedMB}/${memTotalMB}MB, RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    
    // Warn if memory usage is high (approaching 1GB Kubernetes limit)
    if (memUsedMB > 200) {
        console.warn(`[WARNING] High memory usage: ${memUsedMB}MB`);
    }
    if (memUsedMB > 1000) {
        console.error(`[CRITICAL] Memory usage approaching Kubernetes limit: ${memUsedMB}MB / 1228MB`);
    }
    
    // Check RSS memory against container limit
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    if (rssMB > 1100) {
        console.error(`[CRITICAL] RSS memory near container limit: ${rssMB}MB / 1228MB - Pod may be killed soon!`);
    }
}, 30000);

// Monitor for potential crash triggers
process.on('uncaughtException', (error) => {
    crashCount++;
    console.error(`[CRASH] Uncaught Exception #${crashCount}:`, error);
    console.error(`[CRASH] Uptime before crash: ${process.uptime()}s`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRASH] Unhandled Rejection at:', promise, 'reason:', reason);
    console.error(`[CRASH] Uptime: ${process.uptime()}s`);
});

process.on('SIGTERM', () => {
    console.log('[SHUTDOWN] Received SIGTERM, gracefully shutting down');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[SHUTDOWN] Received SIGINT, gracefully shutting down');
    process.exit(0);
});

server.listen(PORT, () => {
    console.log(`[STARTUP] Server running on port ${PORT}`);
    console.log(`[STARTUP] Process PID: ${process.pid}`);
    console.log(`[STARTUP] Node version: ${process.version}`);
    console.log(`[STARTUP] Memory limit check: ${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`);
});