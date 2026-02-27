"use client";

import { useTaskStore, type Project, type Label } from "@/store/taskStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Inbox,
  Calendar,
  CheckCircle2,
  Search,
  Plus,
  Folder,
  MoreHorizontal,
  Trash2,
  Edit2,
  Star,
  Tag,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast, startOfDay } from "date-fns";
import { useTheme } from "next-themes";

const PROJECT_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef",
  "#ec4899", "#f43f5e",
];

interface SidebarProps {
  onNewTask: () => void;
  onManageLabels: () => void;
}

function SidebarContent({ onNewTask, onManageLabels, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
  const {
    tasks,
    projects,
    labels,
    selectedProjectId,
    currentFilter,
    searchQuery,
    setSelectedProjectId,
    setCurrentFilter,
    setSearchQuery,
    addProject,
    updateProject,
    removeProject,
  } = useTaskStore();

  const { theme, setTheme } = useTheme();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Calculate task counts
  const todayCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return isToday(dueDate);
  }).length;

  const upcomingCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return isTomorrow(dueDate) || isPast(startOfDay(dueDate));
  }).length;

  const overdueCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return isPast(startOfDay(dueDate)) && !isToday(dueDate);
  }).length;

  const completedCount = tasks.filter((t) => t.completed).length;
  const allTasksCount = tasks.filter((t) => !t.completed).length;

  // Get label task counts
  const getLabelTaskCount = (labelId: string) => {
    return tasks.filter((t) =>
      !t.completed && t.labels.some((l) => l.label.id === labelId)
    ).length;
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          color: newProjectColor,
        }),
      });

      if (response.ok) {
        const project = await response.json();
        addProject(project);
        setNewProjectName("");
        setIsDialogOpen(false);
        toast({ title: "Success", description: "Project created successfully" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create project", variant: "destructive" });
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeProject(id);
        if (selectedProjectId === id) {
          setSelectedProjectId(null);
        }
        toast({ title: "Success", description: "Project deleted" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleEditProject = async () => {
    if (!editingProject || !newProjectName.trim()) return;

    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName,
          color: newProjectColor,
        }),
      });

      if (response.ok) {
        const project = await response.json();
        updateProject(editingProject.id, project);
        setEditingProject(null);
        setNewProjectName("");
        setIsDialogOpen(false);
        toast({ title: "Success", description: "Project updated" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update project", variant: "destructive" });
    }
  };

  const handleFilterClick = (filter: string) => {
    setCurrentFilter(filter);
    onNavigate?.();
  };

  const handleProjectClick = (id: string) => {
    setSelectedProjectId(id);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white">TaskFlow</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-slate-400 hover:text-white"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus:border-amber-500 h-9"
          />
        </div>
      </div>

      {/* Quick Add Button */}
      <div className="p-3">
        <Button
          onClick={() => {
            onNewTask();
            onNavigate?.();
          }}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* Filters */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
              Filters
            </h3>
            <nav className="space-y-0.5">
              <button
                onClick={() => handleFilterClick("all")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  currentFilter === "all" && !selectedProjectId
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/50"
                )}
              >
                <Inbox className="w-4 h-4 text-amber-400" />
                <span className="flex-1">All Tasks</span>
                {allTasksCount > 0 && (
                  <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                    {allTasksCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleFilterClick("today")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  currentFilter === "today"
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/50"
                )}
              >
                <Calendar className="w-4 h-4 text-green-400" />
                <span className="flex-1">Today</span>
                {todayCount > 0 && (
                  <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                    {todayCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleFilterClick("upcoming")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  currentFilter === "upcoming"
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/50"
                )}
              >
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="flex-1">Upcoming</span>
                {upcomingCount > 0 && (
                  <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                    {upcomingCount}
                  </span>
                )}
              </button>
              {overdueCount > 0 && (
                <button
                  onClick={() => handleFilterClick("overdue")}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    currentFilter === "overdue"
                      ? "bg-slate-800 text-white"
                      : "text-red-400 hover:bg-slate-800/50"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  <span className="flex-1">Overdue</span>
                  <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                    {overdueCount}
                  </span>
                </button>
              )}
              <button
                onClick={() => handleFilterClick("completed")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  currentFilter === "completed"
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/50"
                )}
              >
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span className="flex-1">Completed</span>
                {completedCount > 0 && (
                  <span className="text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                    {completedCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <Separator className="bg-slate-700 my-4" />

          {/* Labels */}
          {labels.length > 0 && (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Labels
                  </h3>
                  <button
                    onClick={() => {
                      onManageLabels();
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Tag className="w-4 h-4" />
                  </button>
                </div>
                <nav className="space-y-0.5">
                  {labels.slice(0, 5).map((label) => (
                    <button
                      key={label.id}
                      onClick={() => handleFilterClick(`label-${label.id}`)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                        currentFilter === `label-${label.id}`
                          ? "bg-slate-800 text-white"
                          : "text-slate-300 hover:bg-slate-800/50"
                      )}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="flex-1 truncate">{label.name}</span>
                      <span className="text-xs text-slate-500">
                        {getLabelTaskCount(label.id)}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
              <Separator className="bg-slate-700 my-4" />
            </>
          )}

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Projects
              </h3>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingProject(null);
                  setNewProjectName("");
                }
              }}>
                <DialogTrigger asChild>
                  <button className="text-slate-400 hover:text-white transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProject ? "Edit Project" : "New Project"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm text-slate-300 mb-2 block">Name</label>
                      <Input
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name"
                        className="bg-slate-700 border-slate-600 text-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            editingProject ? handleEditProject() : handleCreateProject();
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300 mb-2 block">Color</label>
                      <div className="flex flex-wrap gap-2">
                        {PROJECT_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewProjectColor(color)}
                            className={cn(
                              "w-6 h-6 rounded-full transition-transform",
                              newProjectColor === color && "ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={editingProject ? handleEditProject : handleCreateProject}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    >
                      {editingProject ? "Save Changes" : "Create Project"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <nav className="space-y-0.5">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                    selectedProjectId === project.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800/50"
                  )}
                  onClick={() => handleProjectClick(project.id)}
                >
                  <Folder
                    className="w-4 h-4"
                    style={{ color: project.color }}
                  />
                  <span className="flex-1 truncate">{project.name}</span>
                  <span className="text-xs text-slate-500">
                    {tasks.filter((t) => t.projectId === project.id && !t.completed).length}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem
                        className="text-slate-300 focus:text-white focus:bg-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                          setNewProjectName(project.name);
                          setNewProjectColor(project.color);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-slate-300 focus:text-white focus:bg-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateProject(project.id, { isFavorite: !project.isFavorite });
                        }}
                      >
                        <Star className={cn("w-4 h-4 mr-2", project.isFavorite && "fill-amber-500 text-amber-500")} />
                        {project.isFavorite ? "Unfavorite" : "Favorite"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-400 focus:text-red-300 focus:bg-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4 px-3">
                  No projects yet. Create one to organize your tasks.
                </p>
              )}
            </nav>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function Sidebar({ onNewTask, onManageLabels }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (isCollapsed) {
    return (
      <>
        <div className="hidden md:flex w-14 h-screen bg-slate-900 border-r border-slate-700 flex-col items-center py-4">
          <button
            onClick={() => setIsCollapsed(false)}
            className="text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <Button
            onClick={onNewTask}
            size="icon"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {/* Mobile menu button when collapsed */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        {/* Mobile Sheet */}
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-700">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent onNewTask={onNewTask} onManageLabels={onManageLabels} onNavigate={() => setIsMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 h-screen bg-slate-900 border-r border-slate-700">
        <div className="relative w-full">
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute top-4 right-2 text-slate-400 hover:text-white transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <SidebarContent onNewTask={onNewTask} onManageLabels={onManageLabels} />
        </div>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 bg-slate-800 text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-700">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent onNewTask={onNewTask} onManageLabels={onManageLabels} onNavigate={() => setIsMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
