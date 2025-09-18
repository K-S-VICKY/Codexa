import * as dotenv from "dotenv"
dotenv.config()
import express from "express";
import { createServer } from "http";
import { initWs } from "./ws";
import cors from "cors";

console.log("=== Codexa Runner Service Starting ===");
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform} ${process.arch}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

const app = express();

// Configure CORS for Express
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "https://localhost:5173",
    /^https?:\/\/.*\.davish\.tech$/,
    /^https?:\/\/.*\.vigneshks\.tech$/
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

console.log("✓ CORS configured");

// Handle preflight requests
app.options('*', cors());

// Add basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

console.log("✓ Health check endpoint configured");

const httpServer = createServer(app);

try {
  console.log("Initializing WebSocket server...");
  initWs(httpServer);
  console.log("✓ WebSocket server initialized");
} catch (error) {
  console.error("✗ Failed to initialize WebSocket server:", error);
  process.exit(1);
}

const port = process.env.PORT || 3001;

httpServer.listen(port, () => {
  console.log(`✓ Server listening on port ${port}`);
  console.log(`=== Codexa Runner Service Ready ===`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});