import mongoose from "mongoose";

// User Schema
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    password: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

// Account Schema (for NextAuth)
const AccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
    refresh_token: { type: String },
    access_token: { type: String },
    expires_at: { type: Number },
    token_type: { type: String },
    scope: { type: String },
    id_token: { type: String },
    session_state: { type: String },
  },
  { timestamps: true }
);

// Session Schema (for NextAuth)
const SessionSchema = new mongoose.Schema(
  {
    sessionToken: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true }
);

// Project Schema
const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#6366f1" },
    icon: { type: String },
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Label Schema
const LabelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#6366f1" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Subtask Schema
const SubtaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  },
  { timestamps: true }
);

// Task Schema
const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    priority: { type: Number, default: 0 }, // 0: none, 1: low, 2: medium, 3: high, 4: urgent
    dueDate: { type: Date },
    order: { type: Number, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    labels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Label" }],
  },
  { timestamps: true }
);

// Create indexes
UserSchema.index({ email: 1 });
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });
SessionSchema.index({ sessionToken: 1 }, { unique: true });
TaskSchema.index({ userId: 1, projectId: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });

// Export models
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Account = mongoose.models.Account || mongoose.model("Account", AccountSchema);
export const Session = mongoose.models.Session || mongoose.model("Session", SessionSchema);
export const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);
export const Label = mongoose.models.Label || mongoose.model("Label", LabelSchema);
export const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema);
export const Subtask = mongoose.models.Subtask || mongoose.model("Subtask", SubtaskSchema);
