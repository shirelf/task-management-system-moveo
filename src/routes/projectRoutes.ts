import { Router } from 'express';
import { createProject, getProjects, updateProject, deleteProject } from '../controllers/ProjectController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate, createProject);
router.get('/',authenticate, getProjects);
router.put('/:id', authenticate, updateProject);  
router.delete('/:id', authenticate, deleteProject);

export default router;
