"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export type NotificationPermission = "default" | "granted" | "denied";

interface TaskReminder {
  id: string;
  title: string;
  dueDate: string;
  project?: {
    name: string;
    color: string;
  } | null;
}

export function useNotifications() {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedRef = useRef(false);

  // Check if notifications are supported - use layout effect pattern
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      // Use requestAnimationFrame to avoid sync setState warning
      requestAnimationFrame(() => {
        setIsSupported(true);
        setPermission(Notification.permission as NotificationPermission);
      });
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  // Show a local notification
  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return;

      try {
        const notification = new Notification(title, {
          icon: "/logo.svg",
          badge: "/logo.svg",
          tag: "taskflow-reminder",
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    },
    [isSupported, permission]
  );

  // Check for upcoming task reminders
  const checkReminders = useCallback(async () => {
    if (!session?.user || permission !== "granted") return;

    try {
      const response = await fetch("/api/notifications/reminders");
      if (!response.ok) return;

      const data = await response.json();
      const tasks: TaskReminder[] = data.tasks || [];

      for (const task of tasks) {
        const dueDate = new Date(task.dueDate);
        const formattedDate = dueDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        showNotification(`Task Reminder: ${task.title}`, {
          body: `Due: ${formattedDate}${task.project ? ` • Project: ${task.project.name}` : ""}`,
          tag: `task-${task.id}`,
          requireInteraction: true,
        });

        // Mark reminder as sent
        await fetch("/api/notifications/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: task.id }),
        });
      }
    } catch (error) {
      console.error("Error checking reminders:", error);
    }
  }, [session, permission, showNotification]);

  // Start periodic reminder checking
  const startReminderCheck = useCallback(
    (intervalMinutes = 5) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Check immediately
      checkReminders();

      // Then check periodically
      intervalRef.current = setInterval(checkReminders, intervalMinutes * 60 * 1000);
      setIsChecking(true);
    },
    [checkReminders]
  );

  // Stop reminder checking
  const stopReminderCheck = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsChecking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Auto-start checking when permission is granted
  useEffect(() => {
    if (permission === "granted" && session?.user && !isChecking && !hasStartedRef.current) {
      hasStartedRef.current = true;
      // Use setTimeout to avoid sync setState warning
      const timer = setTimeout(() => {
        startReminderCheck(5); // Check every 5 minutes
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [permission, session, isChecking, startReminderCheck]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    checkReminders,
    startReminderCheck,
    stopReminderCheck,
    isChecking,
  };
}

// Hook for scheduling a specific task reminder
export function useTaskReminder() {
  const { showNotification, permission } = useNotifications();

  const scheduleReminder = useCallback(
    (task: {
      id: string;
      title: string;
      dueDate: Date;
      reminderDays?: number | null;
      projectName?: string;
    }) => {
      const days = task.reminderDays;
      if (permission !== "granted" || !days || !task.dueDate) {
        return;
      }

      const dueDate = new Date(task.dueDate);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - days);

      const now = new Date();
      const delay = reminderDate.getTime() - now.getTime();

      if (delay > 0) {
        setTimeout(() => {
          showNotification(`Reminder: ${task.title}`, {
            body: `Due in ${days} day${days > 1 ? "s" : ""}${task.projectName ? ` • ${task.projectName}` : ""}`,
            tag: `task-reminder-${task.id}`,
            requireInteraction: true,
          });
        }, delay);
      }
    },
    [permission, showNotification]
  );

  return { scheduleReminder };
}
