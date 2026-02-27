"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTaskStore } from "@/store/taskStore";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  Flag,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, isWithinInterval, subDays } from "date-fns";

interface StatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatsDialog({ open, onOpenChange }: StatsDialogProps) {
  const { tasks, projects } = useTaskStore();

  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Tasks completed this week
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const completedThisWeek = completedTasks.filter((t) => {
    const updatedAt = new Date(t.updatedAt);
    return isWithinInterval(updatedAt, { start: weekStart, end: weekEnd });
  }).length;

  // Tasks due today
  const dueToday = pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  }).length;

  // Overdue tasks
  const overdue = pendingTasks.filter((t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < today;
  }).length;

  // High priority pending
  const highPriority = pendingTasks.filter((t) => t.priority >= 3).length;

  // Tasks by priority
  const tasksByPriority = [
    { label: "Urgent", count: pendingTasks.filter((t) => t.priority === 4).length, color: "bg-red-500" },
    { label: "High", count: pendingTasks.filter((t) => t.priority === 3).length, color: "bg-orange-500" },
    { label: "Medium", count: pendingTasks.filter((t) => t.priority === 2).length, color: "bg-yellow-500" },
    { label: "Low", count: pendingTasks.filter((t) => t.priority === 1).length, color: "bg-blue-500" },
  ];

  // Tasks completed in last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const count = completedTasks.filter((t) => {
      const updatedAt = new Date(t.updatedAt);
      return (
        updatedAt.getDate() === date.getDate() &&
        updatedAt.getMonth() === date.getMonth() &&
        updatedAt.getFullYear() === date.getFullYear()
      );
    }).length;
    return { date, count };
  });

  const maxCount = Math.max(...last7Days.map((d) => d.count), 1);

  // Tasks by project
  const tasksByProject = projects.map((p) => ({
    name: p.name,
    color: p.color,
    total: tasks.filter((t) => t.projectId === p.id).length,
    completed: tasks.filter((t) => t.projectId === p.id && t.completed).length,
  })).filter((p) => p.total > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Productivity Stats
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 pt-4">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 rounded-xl p-4 text-center">
              <Target className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{totalTasks}</p>
              <p className="text-xs text-slate-400">Total Tasks</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{completedTasks.length}</p>
              <p className="text-xs text-slate-400">Completed</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{pendingTasks.length}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4 text-center">
              <Flag className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{overdue}</p>
              <p className="text-xs text-slate-400">Overdue</p>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-slate-700/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Completion Rate</h3>
              <span className="text-amber-500 font-bold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2 bg-slate-600" />
          </div>

          {/* Week Progress */}
          <div className="bg-slate-700/50 rounded-xl p-4">
            <h3 className="font-medium mb-4">Last 7 Days</h3>
            <div className="flex items-end justify-between gap-2 h-24">
              {last7Days.map(({ date, count }, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-amber-500 to-orange-500 rounded-t transition-all"
                    style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? "4px" : "0" }}
                  />
                  <span className="text-xs text-slate-400 mt-2">{format(date, "EEE")}</span>
                  <span className="text-xs text-slate-500">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-slate-700/50 rounded-xl p-4">
            <h3 className="font-medium mb-4">Pending by Priority</h3>
            <div className="space-y-3">
              {tasksByPriority.map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm text-slate-300 flex-1">{label}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">This Week</span>
              </div>
              <p className="text-2xl font-bold">{completedThisWeek}</p>
              <p className="text-xs text-slate-400">tasks completed</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Due Today</span>
              </div>
              <p className="text-2xl font-bold">{dueToday}</p>
              <p className="text-xs text-slate-400">tasks pending</p>
            </div>
          </div>

          {/* Project Progress */}
          {tasksByProject.length > 0 && (
            <div className="bg-slate-700/50 rounded-xl p-4">
              <h3 className="font-medium mb-4">Project Progress</h3>
              <div className="space-y-3">
                {tasksByProject.map(({ name, color, total, completed }) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm">{name}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {completed}/{total}
                      </span>
                    </div>
                    <Progress
                      value={(completed / total) * 100}
                      className="h-1.5 bg-slate-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
