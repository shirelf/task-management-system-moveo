import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import jwt, { JwtPayload } from 'jsonwebtoken';
import axios from 'axios';
import jose from 'node-jose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand, ChallengeNameType, AuthFlowType } from '@aws-sdk/client-cognito-identity-provider';

dotenv.config();

const { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, COGNITO_REGION, COGNITO_CLIENT_SECRET, MONGODB_URI } = process.env;

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB');
  }).catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });

// Task interface for Mongoose
interface Task extends Document {
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  projectId: mongoose.Schema.Types.ObjectId;
}

// Project interface for Mongoose
interface Project extends Document {
  name: string;
  description: string;
  tasks: mongoose.Schema.Types.ObjectId[];
}

// Task schema
const taskSchema: Schema<Task> = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
});

// Project schema
const projectSchema: Schema<Project> = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
});

// Mongoose models
const TaskModel: Model<Task> = mongoose.model('Task', taskSchema);
const ProjectModel: Model<Project> = mongoose.model('Project', projectSchema);

const cognitoClient = new CognitoIdentityProviderClient({ region: COGNITO_REGION });

const getKeyStore = async (): Promise<jose.JWK.KeyStore> => {
  const url = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  const response = await axios.get(url);
  return jose.JWK.asKeyStore(response.data);
};

const verifyToken = async (token: string): Promise<JwtPayload> => {
  const keystore = await getKeyStore();
  const decodedHeader = jwt.decode(token, { complete: true })?.header;

  if (!decodedHeader || !decodedHeader.kid) {
    throw new Error('Invalid token header');
  }

  const key = keystore.get(decodedHeader.kid);
  if (!key) {
    throw new Error('Key not found in keystore');
  }

  return jwt.verify(token, key.toPEM(), {
    audience: COGNITO_CLIENT_ID,
    issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
  }) as JwtPayload;
};

// Extend Express's Request interface to include the user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

const generateSecretHash = (username: string): string => {
  return crypto.createHmac('sha256', COGNITO_CLIENT_SECRET!)
    .update(username + COGNITO_CLIENT_ID!)
    .digest('base64');
};

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    req.user = await verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token', error: (err as Error).message });
  }
};

// Project Routes

app.post('/projects', authenticate, async (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description are required' });
  }

  const newProject = new ProjectModel({ name, description });

  try {
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save project', error: (err as Error).message });
  }
});

app.get('/projects', authenticate, async (req: Request, res: Response) => {
  try {
    const projects = await ProjectModel.find().populate('tasks');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch projects', error: (err as Error).message });
  }
});

app.put('/projects/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const project = await ProjectModel.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update project', error: (err as Error).message });
  }
});

app.delete('/projects/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const project = await ProjectModel.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await TaskModel.deleteMany({ projectId: id });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete project', error: (err as Error).message });
  }
});


app.post('/projects/:projectId/tasks', authenticate, async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { title, description, status } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const projectObjectId = new mongoose.Types.ObjectId(projectId as string); // Explicitly cast projectId to string

    const project = await ProjectModel.findById(projectObjectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const newTask = new TaskModel({
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
});

app.get('/projects/:projectId/tasks', authenticate, async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    const projectObjectId = new mongoose.Types.ObjectId(projectId as string); // Explicitly cast projectId to string
    const tasks = await TaskModel.find({ projectId: projectObjectId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: (err as Error).message });
  }
});

app.put('/projects/:projectId/tasks/:taskId', authenticate, async (req: Request, res: Response) => {
  const { projectId, taskId } = req.params;
  const { title, description, status } = req.body;

  try {
    const projectObjectId = new mongoose.Types.ObjectId(projectId as string); // Explicitly cast projectId to string
    const task = await TaskModel.findOne({ _id: taskId, projectId: projectObjectId });
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
});

app.delete('/projects/:projectId/tasks/:taskId', authenticate, async (req: Request, res: Response) => {
  const { projectId, taskId } = req.params;

  try {
    const projectObjectId = new mongoose.Types.ObjectId(projectId as string); // Explicitly cast projectId to string
    const task = await TaskModel.findOneAndDelete({ _id: taskId, projectId: projectObjectId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await ProjectModel.findByIdAndUpdate(projectObjectId, { $pull: { tasks: taskId } });

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: (err as Error).message });
  }
});

app.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH' as AuthFlowType,
    ClientId: COGNITO_CLIENT_ID!,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH: generateSecretHash(username)
    }
  };

  try {
    const command = new InitiateAuthCommand(params);
    const data = await cognitoClient.send(command);

    if (data.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      res.json({ message: 'NEW_PASSWORD_REQUIRED', session: data.Session });
    } else if (data.AuthenticationResult) {
      res.json(data.AuthenticationResult);
    } else {
      res.status(400).json({ message: 'Authentication failed' });
    }
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
});

app.post('/respond-to-new-password-challenge', async (req: Request, res: Response) => {
  const { username, newPassword, session } = req.body;
  const params = {
    ChallengeName: 'NEW_PASSWORD_REQUIRED' as ChallengeNameType,
    ClientId: COGNITO_CLIENT_ID!,
    ChallengeResponses: {
      USERNAME: username,
      NEW_PASSWORD: newPassword,
      SECRET_HASH: generateSecretHash(username)
    },
    Session: session
  };

  try {
    const command = new RespondToAuthChallengeCommand(params);
    const data = await cognitoClient.send(command);

    if (data.AuthenticationResult) {
      res.json(data.AuthenticationResult);
    } else {
      res.status(400).json({ message: 'Failed to set new password' });
    }
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
});

app.get('/verify', authenticate, (req: Request, res: Response) => {
  res.json({ message: 'Token is valid', user: req.user });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));