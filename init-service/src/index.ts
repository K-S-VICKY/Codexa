import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
dotenv.config()
import { copyS3Folder } from "./aws";
import { authRouter, authMiddleware } from "./auth";
import { projectsRouter } from "./projects";
import { tasksRouter } from "./tasks";

const app = express();
app.use(express.json());
app.use(cors())

// Health
app.get("/health", (_req, res) => res.send("ok"));

// Public auth routes
app.use("/auth", authRouter);

// Protected project routes
app.use(authMiddleware, projectsRouter);

// Protected task routes
app.use(authMiddleware, tasksRouter);

const port = process.env.PORT || 3001;

async function start() {
    const mongoUri = process.env.MONGO_URI || "";
    if (!mongoUri) {
        console.error("Missing MONGO_URI env var");
        process.exit(1);
    }
    await mongoose.connect(mongoUri, { dbName: process.env.MONGO_DB || "codexa" });
    app.listen(port, () => {
        console.log(`listening on *:${port}`);
        console.log("S3_BUCKET:", process.env.S3_BUCKET);
    });
}

start().catch((e) => {
    console.error("Failed to start server", e);
    process.exit(1);
});
