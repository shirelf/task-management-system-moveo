import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MONGODB_URI } from './envConfig';

dotenv.config();

const connectDB = async (): Promise<void> => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in the environment variables.');
    process.exit(1); // Exit the process with an error code
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); // Exit the process with an error code
  }
};

export default connectDB;
