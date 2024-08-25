import { Router } from 'express';
import { createTask, deleteTask, getTasks, updateTask} from '../controllers/TaskController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/:projectId/tasks', authenticate, createTask);
router.get('/:projectId/tasks', authenticate, getTasks);
router.put('/:projectId/tasks/:taskId', authenticate, updateTask);
router.delete('/:projectId/tasks/:taskId', authenticate, deleteTask);


export default router;
