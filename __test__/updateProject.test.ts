import { Request, Response } from 'express';
import { updateProject } from '../src/controllers/ProjectController';
import Project from '../src/models/Project';

jest.mock('../src/models/Project');

describe('ProjectController - updateProject', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {
      params: { id: '1' },
      body: { name: 'Updated Project', description: 'Updated description' },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should update a project and return it', async () => {
    const mockProject = { id: '1', name: 'Updated Project', description: 'Updated description' };
    (Project.findById as jest.Mock).mockResolvedValue(mockProject);
    (Project.prototype.save as jest.Mock).mockResolvedValue(mockProject);

    await updateProject(req as Request, res as Response);

    expect(Project.findById).toHaveBeenCalledWith('1');
  });

  it('should return 404 if project not found', async () => {
    (Project.findById as jest.Mock).mockResolvedValue(null);

    await updateProject(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
  });

  it('should handle errors', async () => {
    const error = new Error('Update failed');
    (Project.findById as jest.Mock).mockRejectedValue(error);

    await updateProject(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Failed to update project',
      error: error.message,
    });
  });
});
