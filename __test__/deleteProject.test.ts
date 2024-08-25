import { Request, Response } from 'express';
import { deleteProject } from '../src/controllers/ProjectController';
import Project from '../src/models/Project';
import Task from '../src/models/Task';

jest.mock('../src/models/Project');
jest.mock('../src/models/Task');

describe('ProjectController - deleteProject', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: { id: '1' },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should delete a project and its tasks', async () => {
    const mockProject = { id: '1', name: 'Project to delete' };
    (Project.findByIdAndDelete as jest.Mock).mockResolvedValue(mockProject);
    (Task.deleteMany as jest.Mock).mockResolvedValue({});

    await deleteProject(req as Request, res as Response);

    expect(Project.findByIdAndDelete).toHaveBeenCalledWith('1');
    expect(Task.deleteMany).toHaveBeenCalledWith({ projectId: '1' });
    expect(res.json).toHaveBeenCalledWith(mockProject);
  });

  it('should return 404 if project not found', async () => {
    (Project.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

    await deleteProject(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
  });

  it('should handle errors', async () => {
    const error = new Error('Delete failed');
    (Project.findByIdAndDelete as jest.Mock).mockRejectedValue(error);

    await deleteProject(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Failed to delete project',
      error: error.message,
    });
  });
});
