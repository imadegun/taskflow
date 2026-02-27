"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTaskStore } from "@/store/taskStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Edit2,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LABEL_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef",
  "#ec4899", "#f43f5e", "#6366f1", "#0ea5e9", "#10b981",
];

export function LabelDialog({ open, onOpenChange }: LabelDialogProps) {
  const { labels, addLabel, updateLabel, removeLabel } = useTaskStore();
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLabelName,
          color: newLabelColor,
        }),
      });

      if (response.ok) {
        const label = await response.json();
        addLabel(label);
        setNewLabelName("");
        toast({ title: "Success", description: "Label created" });
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error || "Failed to create label", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create label", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLabel = async (id: string) => {
    if (!editName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/labels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          color: editColor,
        }),
      });

      if (response.ok) {
        const label = await response.json();
        updateLabel(id, label);
        setEditingLabel(null);
        toast({ title: "Success", description: "Label updated" });
      } else {
        toast({ title: "Error", description: "Failed to update label", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update label", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLabel = async (id: string) => {
    try {
      const response = await fetch(`/api/labels/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeLabel(id);
        toast({ title: "Success", description: "Label deleted" });
      } else {
        toast({ title: "Error", description: "Failed to delete label", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete label", variant: "destructive" });
    }
  };

  const startEditing = (id: string, name: string, color: string) => {
    setEditingLabel(id);
    setEditName(name);
    setEditColor(color);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Labels</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Create new label */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Create New Label</h4>
            <div className="flex gap-2">
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name"
                className="bg-slate-700 border-slate-600 text-white"
                onKeyDown={(e) => e.key === "Enter" && handleCreateLabel()}
              />
              <Button
                onClick={handleCreateLabel}
                disabled={!newLabelName.trim() || isLoading}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewLabelColor(color)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all",
                    newLabelColor === color && "ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Existing labels */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Your Labels</h4>
            {labels.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No labels yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50"
                  >
                    {editingLabel === label.id ? (
                      <>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 h-8 bg-slate-600 border-slate-500 text-white text-sm"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          {LABEL_COLORS.slice(0, 6).map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditColor(color)}
                              className={cn(
                                "w-5 h-5 rounded-full transition-all",
                                editColor === color && "ring-1 ring-white"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateLabel(label.id)}
                          disabled={isLoading}
                          className="h-8 bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingLabel(null)}
                          className="h-8 text-slate-400"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <Badge
                          className="flex-1 justify-start"
                          style={{
                            backgroundColor: label.color + "20",
                            color: label.color,
                            border: "none",
                          }}
                        >
                          {label.name}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-400 hover:text-white"
                          onClick={() => startEditing(label.id, label.name, label.color)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-400 hover:text-red-400"
                          onClick={() => handleDeleteLabel(label.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
