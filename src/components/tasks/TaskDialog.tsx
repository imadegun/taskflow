"use client";

import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/taskStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Flag,
  X,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIORITY_OPTIONS = [
  { value: 0, label: "No priority", color: "text-slate-400" },
  { value: 1, label: "Low", color: "text-blue-400" },
  { value: 2, label: "Medium", color: "text-yellow-400" },
  { value: 3, label: "High", color: "text-orange-400" },
  { value: 4, label: "Urgent", color: "text-red-400" },
];

const QUICK_DATES = [
  { label: "Today", date: new Date() },
  { label: "Tomorrow", date: addDays(new Date(), 1) },
  { label: "Next Week", date: addDays(new Date(), 7) },
  { label: "Next Month", date: addDays(new Date(), 30) },
];

const NO_PROJECT_VALUE = "__none__";

export function TaskDialog({ open, onOpenChange }: TaskDialogProps) {
  const { addTask, projects, labels, selectedProjectId } = useTaskStore();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [projectId, setProjectId] = useState<string>(selectedProjectId || NO_PROJECT_VALUE);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [showMore, setShowMore] = useState(false);

  // Reset project when selectedProjectId changes
  useEffect(() => {
    if (open) {
      setProjectId(selectedProjectId || NO_PROJECT_VALUE);
    }
  }, [selectedProjectId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: dueDate?.toISOString(),
          projectId: projectId === NO_PROJECT_VALUE ? null : projectId || null,
          labelIds: selectedLabels,
          subtasks: subtasks.map((title, index) => ({ title, order: index })),
        }),
      });

      if (response.ok) {
        const task = await response.json();
        addTask(task);
        toast({ title: "Task created!", description: "Your task has been added." });
        resetForm();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error || "Failed to create task", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority(0);
    setDueDate(undefined);
    setProjectId(selectedProjectId || NO_PROJECT_VALUE);
    setSelectedLabels([]);
    setSubtasks([]);
    setNewSubtask("");
    setShowMore(false);
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask("");
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  // Auto-close on escape is handled by dialog

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Add New Task
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-slate-300">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 text-lg"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-slate-300">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[60px]"
            />
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap gap-2">
            {/* Project */}
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-[140px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value={NO_PROJECT_VALUE} className="text-white focus:bg-slate-600">
                  No project
                </SelectItem>
                {projects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id}
                    className="text-white focus:bg-slate-600"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select
              value={priority.toString()}
              onValueChange={(v) => setPriority(parseInt(v))}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {PRIORITY_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                    className="text-white focus:bg-slate-600"
                  >
                    <div className="flex items-center gap-2">
                      <Flag className={cn("w-4 h-4", option.color)} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Due Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                    !dueDate && "text-slate-400"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dueDate ? format(dueDate, "MMM d") : "Due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <div className="p-2 border-b border-slate-700">
                  <div className="flex flex-wrap gap-1">
                    {QUICK_DATES.map(({ label, date }) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        onClick={() => setDueDate(date)}
                        className="text-xs text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        {label}
                      </Button>
                    ))}
                    {dueDate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDueDate(undefined)}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-slate-700"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Show More Options */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowMore(!showMore)}
            className="text-slate-400 hover:text-white w-full"
          >
            {showMore ? "Hide options" : "Show more options"}
          </Button>

          {showMore && (
            <div className="space-y-4">
              {/* Labels */}
              {labels.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Labels</Label>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <Badge
                        key={label.id}
                        onClick={() => toggleLabel(label.id)}
                        className={cn(
                          "cursor-pointer transition-all border",
                          selectedLabels.includes(label.id)
                            ? "ring-2 ring-white"
                            : "opacity-60 hover:opacity-100"
                        )}
                        style={{
                          backgroundColor: label.color + "30",
                          color: label.color,
                          borderColor: label.color,
                        }}
                      >
                        {label.name}
                        {selectedLabels.includes(label.id) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtasks */}
              <div className="space-y-2">
                <Label className="text-slate-300">Subtasks</Label>
                <div className="space-y-2">
                  {subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-white">
                        {subtask}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubtask(index)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add a subtask..."
                      className="bg-slate-700 border-slate-600 text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSubtask();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={addSubtask}
                      disabled={!newSubtask.trim()}
                      className="text-slate-400 hover:text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || isLoading}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white min-w-[120px]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
