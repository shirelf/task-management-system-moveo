import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createTask, getTasks, updateTask, deleteTask } from '../src/controllers/TaskController';
import Task from '../src/models/Task';
import Project from '../src/models/Project';

jest.mock('../src/models/Task');
jest.mock('../src/models/Project');

describe('TaskController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;
  
    beforeEach(() => {
      statusMock = jest.fn().mockReturnThis();
      jsonMock = jest.fn();
      req = {};
      res = {
        status: statusMock,
        json: jsonMock,
      };
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
   
  describe('createTask', () => {
    it('should return 400 if title or description is missing', async () => {
      req.body = { title: '', description: '' };
      req.params = { projectId: 'someProjectId' };

      await createTask(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Title and description are required' });
    });

    it('should create and save a new task', async () => {
      const mockProject = { _id: new mongoose.Types.ObjectId(), tasks: [], save: jest.fn() };
      const mockTask = { _id: new mongoose.Types.ObjectId(), title: 'Test Task', save: jest.fn().mockResolvedValueOnce(this) };

      req.body = { title: 'Test Task', description: 'Task description', status: 'Pending' };
      req.params = { projectId: mockProject._id.toString() };

      (Project.findById as jest.Mock).mockResolvedValue(mockProject);
      (Task.prototype.save as jest.Mock).mockResolvedValue(mockTask);

      await createTask(req as Request, res as Response);

      expect(Task.prototype.save).toHaveBeenCalled();
      expect(mockProject.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    it('should handle errors during task creation', async () => {
      req.body = { title: 'Test Task', description: 'Task description' };
      req.params = { projectId: new mongoose.Types.ObjectId().toString() };

      const mockError = new Error('Failed to save task');
      (Task.prototype.save as jest.Mock).mockRejectedValue(mockError);

      await createTask(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to save task', error: mockError.message });
    });
  });
  
  
    describe('getTasks', () => {
      it('should return tasks for a given project', async () => {
        const mockTasks = [{ title: 'Task 1' }, { title: 'Task 2' }];
        req.params = { projectId: new mongoose.Types.ObjectId().toString() };
  
        (Task.find as jest.Mock).mockResolvedValue(mockTasks);
  
        await getTasks(req as Request, res as Response);
  
        expect(Task.find).toHaveBeenCalledWith({ projectId: expect.any(mongoose.Types.ObjectId) });
        expect(res.json).toHaveBeenCalledWith(mockTasks);
      });
  
      it('should handle errors', async () => {
        req.params = { projectId: new mongoose.Types.ObjectId().toString() };
  
        const mockError = new Error('Failed to fetch tasks');
        (Task.find as jest.Mock).mockRejectedValue(mockError);
  
        await getTasks(req as Request, res as Response);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to fetch tasks', error: mockError.message });
      });
    });
  
    describe('updateTask', () => {
      it('should return 404 if task is not found', async () => {
        req.params = { projectId: new mongoose.Types.ObjectId().toString(), taskId: new mongoose.Types.ObjectId().toString() };
        req.body = { title: 'Updated Task' };
  
        (Task.findOne as jest.Mock).mockResolvedValue(null);
  
        await updateTask(req as Request, res as Response);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
      });
  
      it('should update and return the task', async () => {
        const mockTask = {
          _id: new mongoose.Types.ObjectId(),
          title: 'Original Task',
          save: jest.fn().mockResolvedValue({ title: 'Updated Task' }),
        };
        req.params = { projectId: new mongoose.Types.ObjectId().toString(), taskId: mockTask._id.toString() };
        req.body = { title: 'Updated Task' };
  
        (Task.findOne as jest.Mock).mockResolvedValue(mockTask);
  
        await updateTask(req as Request, res as Response);
  
        expect(mockTask.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ title: 'Updated Task' });
      });
  
      it('should handle errors', async () => {
        req.params = { projectId: new mongoose.Types.ObjectId().toString(), taskId: new mongoose.Types.ObjectId().toString() };
        req.body = { title: 'Updated Task' };
  
        const mockError = new Error('Failed to update task');
        (Task.findOne as jest.Mock).mockRejectedValue(mockError);
  
        await updateTask(req as Request, res as Response);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to update task', error: mockError.message });
      });
    });
  
    describe('deleteTask', () => {
      it('should return 404 if task is not found', async () => {
        req.params = { projectId: new mongoose.Types.ObjectId().toString(), taskId: new mongoose.Types.ObjectId().toString() };
  
        (Task.findOneAndDelete as jest.Mock).mockResolvedValue(null);
  
        await deleteTask(req as Request, res as Response);
  
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
      });
  
      it('should delete the task and update the project', async () => {
        const mockTask = { _id: new mongoose.Types.ObjectId() };
        req.params = { projectId: new mongoose.Types.ObjectId().toString(), taskId: mockTask._id.toString() };
  
        (Task.findOneAndDelete as jest.Mock).mockResolvedValue(mockTask);
        (Project.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
  
        await deleteTask(req as Request, res as Response);
  
        expect(Task.findOneAndDelete).toHaveBeenCalledWith({ _id: mockTask._id.toString(), projectId: expect.any(mongoose.Types.ObjectId) });
        expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(expect.any(mongoose.Types.ObjectId), { $pull: { tasks: mockTask._id.toString() } });
        expect(res.json).toHaveBeenCalledWith(mockTask);
      });
  
      it('should handle errors', async () => {
        req.params = { projectId: new mongoose.Types.ObjectId().toString(), taskId: new mongoose.Types.ObjectId().toString() };
  
        const mockError = new Error('Failed to delete task');
        (Task.findOneAndDelete as jest.Mock).mockRejectedValue(mockError);
  
        await deleteTask(req as Request, res as Response);
  
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Failed to delete task', error: mockError.message });
      });
    });
  });