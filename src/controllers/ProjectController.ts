import { Request, Response } from "express";
import Project from "../models/Project";
import Task from "../models/Task";

export const getProjects = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1; // default to page 1
  const limit = parseInt(req.query.limit as string) || 10; // default to 10 items per page
  const skip = (page - 1) * limit;

  try {
    const projects = await Project.find()
      .populate("tasks")
      .skip(skip)
      .limit(limit);
    const totalProjects = await Project.countDocuments(); // To get the total number of projects

    res.json({
      projects,
      pagination: {
        total: totalProjects,
        page,
        limit,
        pages: Math.ceil(totalProjects / limit),
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to fetch projects",
        error: (err as Error).message,
      });
  }
};

export const createProject = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res
      .status(400)
      .json({ message: "Name and description are required" });
  }
  const newProject = new Project({ name, description });
  try {
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to save project",
        error: (err as Error).message,
      });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to update project",
        error: (err as Error).message,
      });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    await Task.deleteMany({ projectId: id });
    res.json(project);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to delete project",
        error: (err as Error).message,
      });
  }
};
