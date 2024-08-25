import { Request, Response } from 'express';
import { getProjects } from '../src/controllers/ProjectController';
import Project from '../src/models/Project';

jest.mock('../src/models/Project');

describe('ProjectController - getProjects', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it('should return a list of projects', async () => {
    const mockProjects = [{ name: 'Project 1' }, { name: 'Project 2' }];
    (Project.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockProjects),
    });

    await getProjects(req as Request, res as Response);

    expect(Project.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockProjects);
  });

  it('should handle errors', async () => {
    const error = new Error('Something went wrong');
    (Project.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockRejectedValue(error),
    });

    await getProjects(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Failed to fetch projects',
      error: error.message,
    });
  });
});
