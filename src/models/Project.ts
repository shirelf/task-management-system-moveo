import mongoose, { Document, Model, Schema } from "mongoose";

  interface Project extends Document {
    name: string;
    description: string;
    tasks: mongoose.Schema.Types.ObjectId[];
  }
  
  const projectSchema: Schema<Project> = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  });

export default mongoose.model<Project>("Project", projectSchema);

 
