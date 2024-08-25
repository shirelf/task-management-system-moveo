import mongoose, { Document } from 'mongoose';

enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in-progress',
  Done = 'done',
}

interface Task extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  projectId: mongoose.Schema.Types.ObjectId;
}

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.Todo },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
});

export default mongoose.model<Task>('Task', TaskSchema);