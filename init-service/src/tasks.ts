import express from "express";
import { Task, Project } from "./models";

// Socket.io instance will be passed from main server
let io: any = null;

export const setTaskSocketIO = (socketIO: any) => {
  io = socketIO;
};

export const tasksRouter = express.Router();

// Get all tasks for a project
tasksRouter.get("/projects/:projectId/tasks", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { projectId } = req.params;
  
  // Find project by replId (since projectId is actually replId from frontend)
  const project = await Project.findOne({ replId: projectId, ownerId: userId }).lean();
  if (!project) return res.status(404).json({ message: "Project not found" });

  const tasks = await Task.find({ projectId: project._id, userId }).sort({ createdAt: -1 }).lean();
  return res.json({ tasks });
});

// Create a new task
tasksRouter.post("/projects/:projectId/tasks", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { projectId } = req.params;
  const { title, description, priority, deadline } = req.body;

  if (!title) return res.status(400).json({ message: "Title is required" });

  // Find project by replId (since projectId is actually replId from frontend)
  const project = await Project.findOne({ replId: projectId, ownerId: userId }).lean();
  if (!project) return res.status(404).json({ message: "Project not found" });

  const task = await Task.create({
    projectId: project._id,
    userId,
    title,
    description,
    priority: priority || 'medium',
    deadline: deadline ? new Date(deadline) : undefined
  });

  // Emit real-time update
  if (io) {
    io.to(projectId.toString()).emit('taskCreated', { task });
  }

  return res.status(201).json({ task });
});

// Update a task
tasksRouter.put("/tasks/:taskId", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { taskId } = req.params;
  const { title, description, priority, status, deadline } = req.body;

  const task = await Task.findOne({ _id: taskId, userId }).lean();
  if (!task) return res.status(404).json({ message: "Task not found" });

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (priority !== undefined) updateData.priority = priority;
  if (status !== undefined) updateData.status = status;
  if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    updateData,
    { new: true }
  ).lean();

  // Emit real-time update
  if (io && updatedTask) {
    io.to(updatedTask.projectId.toString()).emit('taskUpdated', { task: updatedTask });
  }

  return res.json({ task: updatedTask });
});

// Delete a task
tasksRouter.delete("/tasks/:taskId", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { taskId } = req.params;

  const task = await Task.findOne({ _id: taskId, userId }).lean();
  if (!task) return res.status(404).json({ message: "Task not found" });

  await Task.findByIdAndDelete(taskId);
  
  // Emit real-time update
  if (io) {
    io.to(task.projectId.toString()).emit('taskDeleted', { taskId });
  }

  return res.status(204).send();
});

// Get task statistics for a project
tasksRouter.get("/projects/:projectId/tasks/stats", async (req, res) => {
  const userId = (req as any).userId as string | undefined;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { projectId } = req.params;

  // Find project by replId (since projectId is actually replId from frontend)
  const project = await Project.findOne({ replId: projectId, ownerId: userId }).lean();
  if (!project) return res.status(404).json({ message: "Project not found" });

  const stats = await Task.aggregate([
    { $match: { projectId: project._id, userId: userId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const formattedStats = {
    todo: 0,
    'in-progress': 0,
    completed: 0
  };

  stats.forEach(stat => {
    formattedStats[stat._id as keyof typeof formattedStats] = stat.count;
  });

  return res.json({ stats: formattedStats });
});
