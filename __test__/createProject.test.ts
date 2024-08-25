import { Request, Response } from 'express';
import { createProject } from '../src/controllers/ProjectController';
import Project from '../src/models/Project';

jest.mock('../src/models/Project');

describe('ProjectController - createProject', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      body: { name: 'New Project', description: 'Project description' },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should create a new project', async () => {
    const mockProject = { id: '1', name: 'New Project', description: 'Project description' };
    (Project.prototype.save as jest.Mock).mockResolvedValue(mockProject);

    await createProject(req as Request, res as Response);

    expect(Project.prototype.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockProject);
  });

  it('should handle missing fields', async () => {
    req.body = {};
    await createProject(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Name and description are required' });
  });

  it('should handle errors', async () => {
    const error = new Error('Save failed');
    (Project.prototype.save as jest.Mock).mockRejectedValue(error);

    await createProject(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Failed to save project',
      error: error.message,
    });
  });
});
