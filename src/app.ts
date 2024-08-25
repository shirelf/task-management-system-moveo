import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes';
import mongoose from 'mongoose';
import connectDB from './config/db';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';

const app = express();

// Init Middleware
app.use(bodyParser.json());

connectDB();

// Define Routes
app.use('/', authRoutes);
app.use('/projects', projectRoutes);
app.use('/projects', taskRoutes);


export default app;
