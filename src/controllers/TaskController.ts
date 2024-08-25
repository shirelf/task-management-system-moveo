import { Request, Response } from 'express';
import Task from '../models/Task';
import mongoose from 'mongoose';
import Project from '../models/Project';

export const createTask = async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title, description, status } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const projectObjectId = new mongoose.Types.ObjectId(projectId as string); // Explicitly cast projectId to string

    const project = await Project.findById(projectObjectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const newTask = new Task({
      title,
      description,
      status,
      projectId: project._id,
    });

    const savedTask = await newTask.save();

    project.tasks.push(savedTask._id as mongoose.Schema.Types.ObjectId); // Explicitly cast _id to Schema.Types.ObjectId
    await project.save();

    res.status(201).json(savedTask);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save task', error: (err as Error).message });
  }
};

  export const getTasks = async (req: Request, res: Response) => {
    const { projectId } = req.params;

  try {
    const projectObjectId = new mongoose.Types.ObjectId(projectId as string); // Explicitly cast projectId to string
    const tasks = await Task.find({ projectId: projectObjectId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: (err as Error).message });
  }
  };
  
  export const updateTask = async (req: Request, res: Response) => {
    const { projectId, taskId } = req.params;
    const { title, description, status } = req.body;
  
    try {
      const projectObjectId = new mongoose.Types.ObjectId(projectId as string); // Explicitly cast projectId to string
      const task = await Task.findOne({ _id: taskId, projectId: projectObjectId });
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
  
      const updatedTask = await task.save();
      res.json(updatedTask);
    } catch (err) {
      res.status(500).json({ message: 'Failed to update task', error: (err as Error).message });
    }
  };
  
  export const deleteTask = async (req: Request, res: Response) => {
    const { projectId, taskId } = req.params;
  
    try {
      const projectObjectId = new mongoose.Types.ObjectId(projectId as string); // Explicitly cast projectId to string
      const task = await Task.findOneAndDelete({ _id: taskId, projectId: projectObjectId });
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      await Project.findByIdAndUpdate(projectObjectId, { $pull: { tasks: taskId } });
  
      res.json(task);
    } catch (err) {
      res.status(500).json({ message: 'Failed to delete task', error: (err as Error).message });
    }
  };