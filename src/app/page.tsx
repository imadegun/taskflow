"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Sidebar } from "@/components/layout/Sidebar";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { useTaskStore } from "@/store/taskStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import {
  Loader2,
  LogOut,
  Settings,
  User,
  Keyboard,
  BarChart3,
  Github,
  Heart,
} from "lucide-react";
import { StatsDialog } from "@/components/tasks/StatsDialog";
import { LabelDialog } from "@/components/tasks/LabelDialog";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const { data: session, status } = useSession();
  const {
    setTasks,
    setProjects,
    setLabels,
    setIsLoading,
    isLoading,
  } = useTaskStore();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      loadData();
    }
  }, [status, session]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, projectsRes, labelsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
        fetch("/api/labels"),
      ]);

      if (tasksRes.ok) {
        const tasks = await tasksRes.json();
        setTasks(tasks);
      }

      if (projectsRes.ok) {
        const projects = await projectsRes.json();
        setProjects(projects);
      }

      if (labelsRes.ok) {
        const labels = await labelsRes.json();
        setLabels(labels);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Quick add task: 'q' or 'n'
      if ((e.key === "q" || e.key === "n") && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setIsTaskDialogOpen(true);
        }
      }
      // Escape to close dialogs
      if (e.key === "Escape") {
        setIsTaskDialogOpen(false);
        setIsStatsOpen(false);
        setIsLabelDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 dark:bg-slate-950">
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          onNewTask={() => setIsTaskDialogOpen(true)}
          onManageLabels={() => setIsLabelDialogOpen(true)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-14 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-2 ml-12 md:ml-0">
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 text-xs text-slate-400">
                <span>Press</span>
                <kbd className="rounded bg-slate-700 px-1 py-0.5 font-mono">Q</kbd>
                <span>to add task</span>
              </kbd>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Stats Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsStatsOpen(true)}
                className="text-slate-400 hover:text-white"
                title="View Statistics"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9 border-2 border-slate-700">
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-semibold">
                        {session?.user?.name?.charAt(0).toUpperCase() ||
                          session?.user?.email?.charAt(0).toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-slate-800 border-slate-700"
                  align="end"
                >
                  <DropdownMenuLabel className="text-white">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session?.user?.name}</p>
                      <p className="text-xs text-slate-400">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer">
                    <Keyboard className="mr-2 h-4 w-4" />
                    Shortcuts
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    className="text-red-400 focus:text-red-300 focus:bg-slate-700 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Task List */}
          <TaskList />

          {/* Footer */}
          <footer className="border-t border-slate-800 bg-slate-900/50 py-3 px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <span>Madegun</span>
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                <span>Gaya 2026</span>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                >
                  <Github className="w-3 h-3" />
                  <span>GitHub</span>
                </a>
                <span className="hidden sm:inline">Vercel deployment</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Task Dialog */}
      <TaskDialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen} />

      {/* Stats Dialog */}
      <StatsDialog open={isStatsOpen} onOpenChange={setIsStatsOpen} />

      {/* Label Dialog */}
      <LabelDialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen} />
    </div>
  );
}
