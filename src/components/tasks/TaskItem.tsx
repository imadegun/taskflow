"use client";

import { useState } from "react";
import { type Task, useTaskStore } from "@/store/taskStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Flag,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Folder,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, isToday, isPast, startOfDay } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
}

const priorityColors = {
  0: "text-slate-400",
  1: "text-blue-400",
  2: "text-yellow-400",
  3: "text-orange-400",
  4: "text-red-400",
};

const priorityLabels = {
  0: "No priority",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Urgent",
};

export function TaskItem({ task }: TaskItemProps) {
  const { updateTask, removeTask, labels } = useTaskStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || "");
  const [newSubtask, setNewSubtask] = useState("");

  const handleToggleComplete = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        updateTask(task.id, updatedTask);
        if (!task.completed) {
          toast({ title: "Task completed!", description: "Great job! 🎉" });
        }
      }
    } catch {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
        }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        updateTask(task.id, updatedTask);
        setIsEditing(false);
        toast({ title: "Task updated" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeTask(task.id);
        toast({ title: "Task deleted" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  const handlePriorityChange = async (priority: number) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        updateTask(task.id, updatedTask);
      }
    } catch {
      toast({ title: "Error", description: "Failed to update priority", variant: "destructive" });
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        updateTask(task.id, updatedTask);
      }
    } catch {
      toast({ title: "Error", description: "Failed to update subtask", variant: "destructive" });
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtask }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        updateTask(task.id, updatedTask);
        setNewSubtask("");
      }
    } catch {
      toast({ title: "Error", description: "Failed to add subtask", variant: "destructive" });
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/subtasks/${subtaskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updatedTask = await response.json();
        updateTask(task.id, updatedTask);
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete subtask", variant: "destructive" });
    }
  };

  const isOverdue = task.dueDate && isPast(startOfDay(new Date(task.dueDate))) && !isToday(new Date(task.dueDate)) && !task.completed;
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "group rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-all",
          task.completed && "opacity-60"
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-4 cursor-pointer">
            <button
              className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            <Checkbox
              checked={task.completed}
              onCheckedChange={handleToggleComplete}
              className="border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                />
              ) : (
                <p
                  className={cn(
                    "text-white truncate",
                    task.completed && "line-through text-slate-400"
                  )}
                >
                  {task.title}
                </p>
              )}
            </div>

            {/* Task Meta */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Labels */}
              {task.labels.length > 0 && (
                <div className="hidden sm:flex gap-1">
                  {task.labels.slice(0, 2).map(({ label }) => (
                    <Badge
                      key={label.id}
                      variant="outline"
                      className="text-xs border-0"
                      style={{ backgroundColor: label.color + "20", color: label.color }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                  {task.labels.length > 2 && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                      +{task.labels.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Due Date */}
              {task.dueDate && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isOverdue
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : isDueToday
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  )}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(task.dueDate), "MMM d")}
                </Badge>
              )}

              {/* Priority */}
              {task.priority > 0 && (
                <Flag
                  className={cn("w-4 h-4", priorityColors[task.priority as keyof typeof priorityColors])}
                />
              )}

              {/* Subtask progress */}
              {totalSubtasks > 0 && (
                <span className="text-xs text-slate-400">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-white"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-800 border-slate-700" align="end">
                  <DropdownMenuItem
                    className="text-slate-300 focus:text-white focus:bg-slate-700"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </DropdownMenuItem>
                  {[1, 2, 3, 4].map((p) => (
                    <DropdownMenuItem
                      key={p}
                      className={cn(
                        "focus:text-white focus:bg-slate-700",
                        task.priority === p ? "bg-slate-700" : ""
                      )}
                      onClick={() => handlePriorityChange(p)}
                    >
                      <Flag className={cn("w-4 h-4 mr-2", priorityColors[p as keyof typeof priorityColors])} />
                      {priorityLabels[p as keyof typeof priorityLabels]}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300 focus:bg-slate-700"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Project indicator */}
            {task.project && !task.completed && (
              <div className="hidden md:flex items-center gap-1 text-slate-400 text-xs">
                <Folder className="w-3 h-3" style={{ color: task.project.color }} />
                <span>{task.project.name}</span>
              </div>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4 ml-11">
            {/* Description */}
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(task.title);
                      setEditDescription(task.description || "");
                    }}
                    className="border-slate-600 text-slate-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              task.description && (
                <p className="text-sm text-slate-400 whitespace-pre-wrap">{task.description}</p>
              )
            )}

            {/* Subtasks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-slate-400 uppercase">
                  Subtasks {totalSubtasks > 0 && `(${completedSubtasks}/${totalSubtasks})`}
                </h4>
              </div>

              {/* Existing subtasks */}
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 group/subtask"
                >
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={(checked) => handleToggleSubtask(subtask.id, !!checked)}
                    className="border-slate-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  />
                  <span
                    className={cn(
                      "text-sm flex-1",
                      subtask.completed ? "line-through text-slate-500" : "text-slate-300"
                    )}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="opacity-0 group-hover/subtask:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add subtask */}
              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add a subtask..."
                  className="bg-slate-800 border-slate-700 text-white text-sm h-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSubtask();
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                  className="h-8 text-slate-400 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {task.labels.map(({ label }) => (
                  <Badge
                    key={label.id}
                    style={{ backgroundColor: label.color + "30", color: label.color }}
                    className="border-0"
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
