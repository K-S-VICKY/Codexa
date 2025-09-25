import express from "express";
import jwt from "jsonwebtoken";
const bcrypt = require("bcryptjs");
import { User } from "./models";

export const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ message: "email, username and password are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, passwordHash });
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username 
      } 
    });
  } catch (e) {
    return res.status(500).json({ message: "Failed to signup" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
    return res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username 
      } 
    });
  } catch (e) {
    return res.status(500).json({ message: "Failed to login" });
  }
});

export function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "devsecret") as { sub: string };
    (req as any).userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}


