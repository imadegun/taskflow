"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "@/hooks/use-toast";

export function NotificationProvider() {
  const { isSupported, permission, requestPermission, startReminderCheck } = useNotifications();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Register service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("[Service Worker] Registered:", registration);
        })
        .catch((error) => {
          console.error("[Service Worker] Registration failed:", error);
        });
    }

    // Show notification button after a delay
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast({
        title: "Notifications enabled",
        description: "You'll receive reminders for your tasks",
      });
      startReminderCheck(5);
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
    }
  };

  if (!isSupported || !showButton || permission === "denied") {
    return null;
  }

  // If already granted, show nothing (background notifications are running)
  if (permission === "granted") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button
        onClick={handleEnableNotifications}
        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
      >
        <Bell className="w-4 h-4 mr-2" />
        Enable Reminders
      </Button>
    </div>
  );
}

// Simple notification toggle button for use in UI
export function NotificationToggle() {
  const { isSupported, permission, requestPermission, isChecking } = useNotifications();

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (permission !== "granted") {
      await requestPermission();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={permission === "granted" ? "text-green-400" : "text-slate-400"}
      title={permission === "granted" ? "Notifications enabled" : "Enable notifications"}
    >
      {permission === "granted" ? (
        <Bell className="w-5 h-5" />
      ) : (
        <BellOff className="w-5 h-5" />
      )}
    </Button>
  );
}
