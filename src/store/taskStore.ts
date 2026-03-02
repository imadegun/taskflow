import { create } from "zustand";

export interface TaskAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface TaskReminder {
  id: string;
  reminderDate: string;
  isSent: boolean;
  sentAt: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: number;
  dueDate: string | null;
  reminderDays: number | null;
  order: number;
  projectId: string | null;
  project: { id: string; name: string; color: string } | null;
  labels: { label: { id: string; name: string; color: string } }[];
  subtasks: { id: string; title: string; completed: boolean; order: number }[];
  attachments: TaskAttachment[];
  reminders: TaskReminder[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  order: number;
  _count?: { tasks: number };
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

interface TaskStore {
  tasks: Task[];
  projects: Project[];
  labels: Label[];
  selectedProjectId: string | null;
  currentFilter: string;
  searchQuery: string;
  isLoading: boolean;
  
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  removeTask: (id: string) => void;
  
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  removeProject: (id: string) => void;
  
  setLabels: (labels: Label[]) => void;
  addLabel: (label: Label) => void;
  updateLabel: (id: string, label: Partial<Label>) => void;
  removeLabel: (id: string) => void;
  
  setSelectedProjectId: (id: string | null) => void;
  setCurrentFilter: (filter: string) => void;
  setSearchQuery: (query: string) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  projects: [],
  labels: [],
  selectedProjectId: null,
  currentFilter: "all",
  searchQuery: "",
  isLoading: false,
  
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updatedTask } : task
      ),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updatedProject) =>
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === id ? { ...project, ...updatedProject } : project
      ),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    })),
  
  setLabels: (labels) => set({ labels }),
  addLabel: (label) => set((state) => ({ labels: [...state.labels, label] })),
  updateLabel: (id, updatedLabel) =>
    set((state) => ({
      labels: state.labels.map((label) =>
        label.id === id ? { ...label, ...updatedLabel } : label
      ),
    })),
  removeLabel: (id) =>
    set((state) => ({
      labels: state.labels.filter((label) => label.id !== id),
    })),
  
  setSelectedProjectId: (id) => set({ selectedProjectId: id, currentFilter: "all" }),
  setCurrentFilter: (filter) => set({ currentFilter: filter, selectedProjectId: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
