"use client";

import { useTaskStore, type Task } from "@/store/taskStore";
import { TaskItem } from "./TaskItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Inbox, Calendar, CheckCircle2, Folder, Clock, Tag } from "lucide-react";
import { isToday, isTomorrow, isFuture, isPast, startOfDay, format } from "date-fns";

export function TaskList() {
  const { tasks, selectedProjectId, currentFilter, searchQuery, isLoading, projects, labels } = useTaskStore();

  // Filter tasks based on current view and search
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !task.title.toLowerCase().includes(query) &&
        !task.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Project filter
    if (selectedProjectId) {
      return task.projectId === selectedProjectId;
    }

    // Label filter
    if (currentFilter.startsWith("label-")) {
      const labelId = currentFilter.replace("label-", "");
      return task.labels.some((l) => l.label.id === labelId);
    }

    // Special filters
    if (currentFilter === "today") {
      if (!task.dueDate) return false;
      return isToday(new Date(task.dueDate)) && !task.completed;
    }

    if (currentFilter === "upcoming") {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return isTomorrow(dueDate) || isFuture(dueDate);
    }

    if (currentFilter === "overdue") {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return isPast(startOfDay(dueDate)) && !isToday(dueDate);
    }

    if (currentFilter === "completed") {
      return task.completed;
    }

    // All tasks - show incomplete by default
    return !task.completed;
  });

  // Sort tasks by priority and due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed at the end
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    // Sort by priority (higher first)
    if (a.priority !== b.priority) return b.priority - a.priority;
    // Sort by due date (earlier first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    // Sort by creation date (newer first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getViewTitle = () => {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId);
      return project?.name || "Project";
    }
    if (currentFilter.startsWith("label-")) {
      const labelId = currentFilter.replace("label-", "");
      const label = labels.find((l) => l.id === labelId);
      return label?.name || "Label";
    }
    switch (currentFilter) {
      case "today":
        return "Today";
      case "upcoming":
        return "Upcoming";
      case "overdue":
        return "Overdue";
      case "completed":
        return "Completed";
      default:
        return "All Tasks";
    }
  };

  const getViewIcon = () => {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId);
      return <Folder className="w-5 h-5" style={{ color: project?.color || "#6366f1" }} />;
    }
    if (currentFilter.startsWith("label-")) {
      const labelId = currentFilter.replace("label-", "");
      const label = labels.find((l) => l.id === labelId);
      return <Tag className="w-5 h-5" style={{ color: label?.color || "#6366f1" }} />;
    }
    switch (currentFilter) {
      case "today":
        return <Calendar className="w-5 h-5 text-green-400" />;
      case "upcoming":
        return <Clock className="w-5 h-5 text-purple-400" />;
      case "overdue":
        return <Clock className="w-5 h-5 text-red-400" />;
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
      default:
        return <Inbox className="w-5 h-5 text-amber-400" />;
    }
  };

  const getEmptyMessage = () => {
    if (searchQuery) {
      return { title: "No tasks found", subtitle: "Try a different search term" };
    }
    switch (currentFilter) {
      case "today":
        return { title: "No tasks for today", subtitle: "Enjoy your day!" };
      case "upcoming":
        return { title: "No upcoming tasks", subtitle: "Plan ahead by adding due dates" };
      case "overdue":
        return { title: "No overdue tasks", subtitle: "Great job staying on track!" };
      case "completed":
        return { title: "No completed tasks", subtitle: "Complete some tasks to see them here" };
      default:
        return { title: "No tasks yet", subtitle: "Create a new task to get started" };
    }
  };

  const incompleteTasks = sortedTasks.filter((t) => !t.completed);
  const completedTasks = sortedTasks.filter((t) => t.completed);

  // Group tasks by date for upcoming view
  const groupTasksByDate = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {};
    tasks.forEach((task) => {
      if (!task.dueDate) {
        if (!groups["No date"]) groups["No date"] = [];
        groups["No date"].push(task);
      } else {
        const date = new Date(task.dueDate);
        let key: string;
        if (isToday(date)) {
          key = "Today";
        } else if (isTomorrow(date)) {
          key = "Tomorrow";
        } else {
          key = format(date, "EEEE, MMMM d");
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(task);
      }
    });
    return groups;
  };

  const showDateGroups = currentFilter === "upcoming" || currentFilter === "today";
  const groupedTasks = showDateGroups ? groupTasksByDate(incompleteTasks) : null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  const emptyMessage = getEmptyMessage();

  return (
    <div className="flex-1 flex flex-col bg-slate-950">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {getViewIcon()}
          <h1 className="text-2xl font-bold text-white">{getViewTitle()}</h1>
          <span className="text-sm text-slate-400 ml-2">
            {incompleteTasks.length} task{incompleteTasks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">{emptyMessage.title}</p>
              <p className="text-slate-500 text-sm mt-1">{emptyMessage.subtitle}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Date-grouped tasks for upcoming view */}
              {groupedTasks ? (
                Object.entries(groupedTasks).map(([date, tasks]) => (
                  <div key={date} className="mb-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-2 px-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {date}
                      <span className="text-slate-500">({tasks.length})</span>
                    </h3>
                    <div className="space-y-1">
                      {tasks.map((task) => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* Regular task list */}
                  {incompleteTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && !showDateGroups && (
                <>
                  <div className="pt-6 pb-2">
                    <h3 className="text-sm font-medium text-slate-400">
                      Completed ({completedTasks.length})
                    </h3>
                  </div>
                  {completedTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
