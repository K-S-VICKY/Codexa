import express from "express";
import { Project, User } from "./models";
import { copyS3Folder } from "./aws";

export const projectsRouter = express.Router();

projectsRouter.get("/projects", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const projects = await Project.find({ ownerId: userId }).sort({ updatedAt: -1 }).lean();
  return res.json({ projects });
});

projectsRouter.post("/projects", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const { replName, language } = req.body;
  if (!replName || !language) return res.status(400).json({ message: "replName and language are required" });

  const user = await User.findById(userId).lean();
  if (!user) return res.status(401).json({ message: "Unauthorized" });

  const username = user.username;
  const base = toDnsLabel(replName);
  let replId = toDnsLabel(`${username}-${base}`);

  // Ensure uniqueness; if taken, append a short suffix
  let suffix = 0;
  while (await Project.findOne({ replId })) {
    suffix += 1;
    replId = toDnsLabel(`${username}-${base}-${suffix}`);
  }

  await copyS3Folder(`base/${language}`, `code/${replId}`);
  const project = await Project.create({ ownerId: userId, replId, language });
  return res.json({ project });
});

function toDnsLabel(input: string): string {
  let s = (input || "").toLowerCase();
  s = s.replace(/[^a-z0-9-]/g, "-");
  s = s.replace(/-+/g, "-");
  s = s.replace(/^-+/, "").replace(/-+$/, "");
  if (s.length === 0) s = "app";
  if (!/[a-z0-9]/.test(s[0]!)) s = `a-${s}`;
  if (!/[a-z0-9]/.test(s[s.length - 1]!)) s = `${s}0`;
  if (s.length > 63) s = s.slice(0, 63);
  return s;
}


