import connectDB from "./mongodb";
import { User, Account, Session, Project, Label, Task, Subtask } from "./models";
import { db as prisma } from "./db-prisma";
import mongoose from "mongoose";

// Check if we're using MongoDB or SQLite
const useMongoDB = process.env.MONGODB_URI || process.env.USE_MONGODB === "true";

// Helper to convert MongoDB document to plain object
function toPlainObject(doc: mongoose.Document | null | undefined) {
  if (!doc) return null;
  const obj = doc.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

function toPlainObjects(docs: mongoose.Document[]) {
  return docs.map((doc) => toPlainObject(doc));
}

// Task interface
interface TaskData {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: number;
  dueDate?: Date | null;
  order?: number;
  userId: string;
  projectId?: string | null;
  labels?: string[];
}

interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: number;
  dueDate?: Date | null;
  order?: number;
  projectId?: string | null;
}

// Project interface
interface ProjectData {
  name: string;
  color?: string;
  icon?: string;
  isFavorite?: boolean;
  order?: number;
  userId: string;
}

// Label interface
interface LabelData {
  name: string;
  color?: string;
  userId: string;
}

// User interface
interface UserData {
  email: string;
  name?: string;
  password?: string;
  image?: string;
}

// Database operations
export const db = {
  // User operations
  user: {
    findUnique: async ({ where }: { where: { email?: string; id?: string } }) => {
      if (useMongoDB) {
        await connectDB();
        if (where.email) {
          return toPlainObject(await User.findOne({ email: where.email }));
        }
        if (where.id) {
          return toPlainObject(await User.findById(where.id));
        }
        return null;
      }
      return prisma.user.findUnique({ where });
    },
    create: async ({ data }: { data: UserData }) => {
      if (useMongoDB) {
        await connectDB();
        const user = await User.create(data);
        return toPlainObject(user);
      }
      return prisma.user.create({ data });
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<UserData> }) => {
      if (useMongoDB) {
        await connectDB();
        const user = await User.findByIdAndUpdate(where.id, data, { new: true });
        return toPlainObject(user);
      }
      return prisma.user.update({ where, data });
    },
  },

  // Task operations
  task: {
    findMany: async ({
      where,
      include,
      orderBy,
    }: {
      where: {
        userId: string;
        projectId?: string | null;
        completed?: boolean;
        dueDate?: { gte: Date; lt: Date };
        OR?: Array<{ title: { contains: string } } | { description: { contains: string } }>;
      };
      include?: { project?: boolean; labels?: { include: { label: boolean } }; subtasks?: boolean };
      orderBy?: Array<{ completed?: "asc" | "desc" } | { order?: "asc" | "desc" } | { createdAt?: "asc" | "desc" }>;
    }) => {
      if (useMongoDB) {
        await connectDB();

        // Build MongoDB query
        const mongoQuery: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(where.userId) };

        if (where.projectId !== undefined) {
          mongoQuery.projectId = where.projectId ? new mongoose.Types.ObjectId(where.projectId) : null;
        }
        if (where.completed !== undefined) {
          mongoQuery.completed = where.completed;
        }
        if (where.dueDate) {
          mongoQuery.dueDate = { $gte: where.dueDate.gte, $lt: where.dueDate.lt };
        }
        if (where.OR) {
          mongoQuery.$or = where.OR.map((condition) => {
            if ("title" in condition) {
              return { title: { $regex: condition.title.contains, $options: "i" } };
            }
            return { description: { $regex: condition.description.contains, $options: "i" } };
          });
        }

        // Build sort
        const sort: Record<string, 1 | -1> = {};
        if (orderBy) {
          for (const order of orderBy) {
            if (order.completed) sort.completed = order.completed === "asc" ? 1 : -1;
            if (order.order) sort.order = order.order === "asc" ? 1 : -1;
            if (order.createdAt) sort.createdAt = order.createdAt === "asc" ? 1 : -1;
          }
        }

        let tasks = await Task.find(mongoQuery)
          .sort(sort)
          .populate("projectId")
          .populate("labels");

        // Get subtasks for each task
        const tasksWithSubtasks = await Promise.all(
          tasks.map(async (task) => {
            const subtasks = await Subtask.find({ taskId: task._id }).sort({ order: 1 });
            const taskObj = task.toObject();
            taskObj.id = taskObj._id.toString();
            delete taskObj._id;
            delete taskObj.__v;
            taskObj.project = taskObj.projectId;
            delete taskObj.projectId;
            if (taskObj.project && taskObj.project._id) {
              taskObj.project.id = taskObj.project._id.toString();
              delete taskObj.project._id;
              delete taskObj.project.__v;
            }
            taskObj.labels = taskObj.labels?.map((l: { _id: mongoose.Types.ObjectId; name: string; color: string }) => ({
              label: { id: l._id.toString(), name: l.name, color: l.color },
            }));
            taskObj.subtasks = subtasks.map((s) => {
              const subtaskObj = s.toObject();
              subtaskObj.id = subtaskObj._id.toString();
              delete subtaskObj._id;
              delete subtaskObj.__v;
              return subtaskObj;
            });
            return taskObj;
          })
        );

        return tasksWithSubtasks;
      }

      return prisma.task.findMany({ where, include, orderBy } as Parameters<typeof prisma.task.findMany>[0]);
    },

    findFirst: async ({ where }: { where: { id: string; userId: string } }) => {
      if (useMongoDB) {
        await connectDB();
        const task = await Task.findOne({ _id: where.id, userId: where.userId });
        return toPlainObject(task);
      }
      return prisma.task.findFirst({ where });
    },

    create: async ({
      data,
      include,
    }: {
      data: TaskData & { labels?: { create: { labelId: string }[] }; subtasks?: { create: { title: string; order: number }[] } };
      include?: { project?: boolean; labels?: { include: { label: boolean } }; subtasks?: boolean };
    }) => {
      if (useMongoDB) {
        await connectDB();

        const taskData: Record<string, unknown> = {
          title: data.title,
          description: data.description || "",
          completed: data.completed || false,
          priority: data.priority || 0,
          dueDate: data.dueDate,
          order: data.order || 0,
          userId: new mongoose.Types.ObjectId(data.userId),
          projectId: data.projectId ? new mongoose.Types.ObjectId(data.projectId) : null,
        };

        // Handle labels
        if (data.labels?.create) {
          taskData.labels = data.labels.create.map((l) => new mongoose.Types.ObjectId(l.labelId));
        }

        const task = await Task.create(taskData);

        // Handle subtasks
        if (data.subtasks?.create) {
          const subtaskDocs = data.subtasks.create.map((s) => ({
            title: s.title,
            order: s.order,
            taskId: task._id,
          }));
          await Subtask.insertMany(subtaskDocs);
        }

        // Return with populated relations
        const populatedTask = await Task.findById(task._id)
          .populate("projectId")
          .populate("labels");

        const subtasks = await Subtask.find({ taskId: task._id }).sort({ order: 1 });

        const taskObj = populatedTask?.toObject() as Record<string, unknown>;
        if (taskObj) {
          taskObj.id = taskObj._id?.toString();
          delete taskObj._id;
          delete taskObj.__v;
          taskObj.project = taskObj.projectId;
          delete taskObj.projectId;
          if (taskObj.project && typeof taskObj.project === "object" && "_id" in taskObj.project) {
            (taskObj.project as Record<string, unknown>).id = (taskObj.project as Record<string, unknown>)._id?.toString();
            delete (taskObj.project as Record<string, unknown>)._id;
            delete (taskObj.project as Record<string, unknown>).__v;
          }
          taskObj.labels = (taskObj.labels as Array<{ _id: mongoose.Types.ObjectId; name: string; color: string }>)?.map((l) => ({
            label: { id: l._id.toString(), name: l.name, color: l.color },
          }));
          taskObj.subtasks = subtasks.map((s) => {
            const subtaskObj = s.toObject();
            subtaskObj.id = subtaskObj._id.toString();
            delete subtaskObj._id;
            delete subtaskObj.__v;
            return subtaskObj;
          });
        }

        return taskObj;
      }

      return prisma.task.create({ data, include } as Parameters<typeof prisma.task.create>[0]);
    },

    update: async ({
      where,
      data,
    }: {
      where: { id: string; userId?: string };
      data: TaskUpdate;
    }) => {
      if (useMongoDB) {
        await connectDB();
        const query: Record<string, unknown> = { _id: where.id };
        if (where.userId) query.userId = where.userId;

        const updateData: Record<string, unknown> = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.completed !== undefined) updateData.completed = data.completed;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
        if (data.order !== undefined) updateData.order = data.order;
        if (data.projectId !== undefined) {
          updateData.projectId = data.projectId ? new mongoose.Types.ObjectId(data.projectId) : null;
        }

        const task = await Task.findOneAndUpdate(query, updateData, { new: true })
          .populate("projectId")
          .populate("labels");

        const subtasks = await Subtask.find({ taskId: task?._id }).sort({ order: 1 });

        const taskObj = task?.toObject() as Record<string, unknown>;
        if (taskObj) {
          taskObj.id = taskObj._id?.toString();
          delete taskObj._id;
          delete taskObj.__v;
          taskObj.project = taskObj.projectId;
          delete taskObj.projectId;
          if (taskObj.project && typeof taskObj.project === "object" && "_id" in taskObj.project) {
            (taskObj.project as Record<string, unknown>).id = (taskObj.project as Record<string, unknown>)._id?.toString();
            delete (taskObj.project as Record<string, unknown>)._id;
            delete (taskObj.project as Record<string, unknown>).__v;
          }
          taskObj.labels = (taskObj.labels as Array<{ _id: mongoose.Types.ObjectId; name: string; color: string }>)?.map((l) => ({
            label: { id: l._id.toString(), name: l.name, color: l.color },
          }));
          taskObj.subtasks = subtasks.map((s) => {
            const subtaskObj = s.toObject();
            subtaskObj.id = subtaskObj._id.toString();
            delete subtaskObj._id;
            delete subtaskObj.__v;
            return subtaskObj;
          });
        }

        return taskObj;
      }

      return prisma.task.update({ where, data } as Parameters<typeof prisma.task.update>[0]);
    },

    delete: async ({ where }: { where: { id: string; userId?: string } }) => {
      if (useMongoDB) {
        await connectDB();
        const query: Record<string, unknown> = { _id: where.id };
        if (where.userId) query.userId = where.userId;

        // Delete subtasks first
        await Subtask.deleteMany({ taskId: where.id });

        const task = await Task.findOneAndDelete(query);
        return toPlainObject(task);
      }

      return prisma.task.delete({ where } as Parameters<typeof prisma.task.delete>[0]);
    },

    aggregate: async ({
      where,
      _max,
    }: {
      where: { userId: string; projectId?: string | null };
      _max: { order: boolean };
    }) => {
      if (useMongoDB) {
        await connectDB();
        const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(where.userId) };
        if (where.projectId !== undefined) {
          query.projectId = where.projectId ? new mongoose.Types.ObjectId(where.projectId) : null;
        }

        const result = await Task.findOne(query).sort({ order: -1 }).select("order");
        return { _max: { order: result?.order ?? null } };
      }

      return prisma.task.aggregate({ where, _max } as Parameters<typeof prisma.task.aggregate>[0]);
    },

    count: async ({ where }: { where: { userId: string; completed?: boolean } }) => {
      if (useMongoDB) {
        await connectDB();
        const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(where.userId) };
        if (where.completed !== undefined) query.completed = where.completed;
        return Task.countDocuments(query);
      }

      return prisma.task.count({ where } as Parameters<typeof prisma.task.count>[0]);
    },
  },

  // Project operations
  project: {
    findMany: async ({
      where,
      orderBy,
    }: {
      where: { userId: string; isArchived?: boolean };
      orderBy?: { order: "asc" | "desc" };
    }) => {
      if (useMongoDB) {
        await connectDB();
        const query: Record<string, unknown> = {
          userId: new mongoose.Types.ObjectId(where.userId),
        };
        if (where.isArchived !== undefined) query.isArchived = where.isArchived;

        const sort: Record<string, 1 | -1> = {};
        if (orderBy?.order) sort.order = orderBy.order === "asc" ? 1 : -1;

        const projects = await Project.find(query).sort(sort);
        return toPlainObjects(projects);
      }

      return prisma.project.findMany({ where, orderBy } as Parameters<typeof prisma.project.findMany>[0]);
    },

    findFirst: async ({ where }: { where: { id: string; userId: string } }) => {
      if (useMongoDB) {
        await connectDB();
        const project = await Project.findOne({ _id: where.id, userId: where.userId });
        return toPlainObject(project);
      }
      return prisma.project.findFirst({ where });
    },

    create: async ({ data }: { data: ProjectData }) => {
      if (useMongoDB) {
        await connectDB();
        const project = await Project.create({
          ...data,
          userId: new mongoose.Types.ObjectId(data.userId),
        });
        return toPlainObject(project);
      }
      return prisma.project.create({ data });
    },

    update: async ({
      where,
      data,
    }: {
      where: { id: string; userId?: string };
      data: Partial<ProjectData>;
    }) => {
      if (useMongoDB) {
        await connectDB();
        const query: Record<string, unknown> = { _id: where.id };
        if (where.userId) query.userId = where.userId;

        const project = await Project.findOneAndUpdate(query, data, { new: true });
        return toPlainObject(project);
      }
      return prisma.project.update({ where, data } as Parameters<typeof prisma.project.update>[0]);
    },

    delete: async ({ where }: { where: { id: string; userId?: string } }) => {
      if (useMongoDB) {
        await connectDB();
        const query: Record<string, unknown> = { _id: where.id };
        if (where.userId) query.userId = where.userId;

        const project = await Project.findOneAndDelete(query);
        return toPlainObject(project);
      }
      return prisma.project.delete({ where } as Parameters<typeof prisma.project.delete>[0]);
    },
  },

  // Label operations
  label: {
    findMany: async ({
      where,
      orderBy,
    }: {
      where: { userId: string };
      orderBy?: { name: "asc" | "desc" };
    }) => {
      if (useMongoDB) {
        await connectDB();
        const sort: Record<string, 1 | -1> = {};
        if (orderBy?.name) sort.name = orderBy.name === "asc" ? 1 : -1;

        const labels = await Label.find({ userId: new mongoose.Types.ObjectId(where.userId) }).sort(sort);
        return toPlainObjects(labels);
      }
      return prisma.label.findMany({ where, orderBy } as Parameters<typeof prisma.label.findMany>[0]);
    },

    findFirst: async ({ where }: { where: { id: string; userId: string } }) => {
      if (useMongoDB) {
        await connectDB();
        const label = await Label.findOne({ _id: where.id, userId: where.userId });
        return toPlainObject(label);
      }
      return prisma.label.findFirst({ where });
    },

    create: async ({ data }: { data: LabelData }) => {
      if (useMongoDB) {
        await connectDB();
        const label = await Label.create({
          ...data,
          userId: new mongoose.Types.ObjectId(data.userId),
        });
        return toPlainObject(label);
      }
      return prisma.label.create({ data });
    },

    update: async ({
      where,
      data,
    }: {
      where: { id: string; userId?: string };
      data: Partial<LabelData>;
    }) => {
      if (useMongoDB) {
        await connectDB();
        const query: Record<string, unknown> = { _id: where.id };
        if (where.userId) query.userId = where.userId;

        const label = await Label.findOneAndUpdate(query, data, { new: true });
        return toPlainObject(label);
      }
      return prisma.label.update({ where, data } as Parameters<typeof prisma.label.update>[0]);
    },

    delete: async ({ where }: { where: { id: string; userId?: string } }) => {
      if (useMongoDB) {
        await connectDB();
        const query: Record<string, unknown> = { _id: where.id };
        if (where.userId) query.userId = where.userId;

        const label = await Label.findOneAndDelete(query);
        return toPlainObject(label);
      }
      return prisma.label.delete({ where } as Parameters<typeof prisma.label.delete>[0]);
    },
  },

  // Subtask operations
  subtask: {
    findMany: async ({ where, orderBy }: { where: { taskId: string }; orderBy?: { order: "asc" | "desc" } }) => {
      if (useMongoDB) {
        await connectDB();
        const sort: Record<string, 1 | -1> = {};
        if (orderBy?.order) sort.order = orderBy.order === "asc" ? 1 : -1;

        const subtasks = await Subtask.find({ taskId: where.taskId }).sort(sort);
        return toPlainObjects(subtasks);
      }
      return prisma.subtask.findMany({ where, orderBy } as Parameters<typeof prisma.subtask.findMany>[0]);
    },

    create: async ({ data }: { data: { title: string; order: number; taskId: string } }) => {
      if (useMongoDB) {
        await connectDB();
        const subtask = await Subtask.create({
          ...data,
          taskId: new mongoose.Types.ObjectId(data.taskId),
        });
        return toPlainObject(subtask);
      }
      return prisma.subtask.create({ data });
    },

    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: { title?: string; completed?: boolean; order?: number };
    }) => {
      if (useMongoDB) {
        await connectDB();
        const subtask = await Subtask.findByIdAndUpdate(where.id, data, { new: true });
        return toPlainObject(subtask);
      }
      return prisma.subtask.update({ where, data });
    },

    delete: async ({ where }: { where: { id: string } }) => {
      if (useMongoDB) {
        await connectDB();
        const subtask = await Subtask.findByIdAndDelete(where.id);
        return toPlainObject(subtask);
      }
      return prisma.subtask.delete({ where });
    },
  },

  // Account operations (for NextAuth)
  account: {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      if (useMongoDB) {
        await connectDB();
        const account = await Account.create({
          ...data,
          userId: new mongoose.Types.ObjectId(data.userId as string),
        });
        return toPlainObject(account);
      }
      return prisma.account.create({ data } as Parameters<typeof prisma.account.create>[0]);
    },
  },
};
