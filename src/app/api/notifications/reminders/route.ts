import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db-prisma";
import { addDays, startOfDay, endOfDay } from "date-fns";

// Get upcoming tasks that need reminders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const today = startOfDay(now);
    const nextWeek = endOfDay(addDays(now, 7));

    // Find tasks with due dates and reminders set
    // that haven't been completed and have reminderDays set
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        completed: false,
        dueDate: {
          gte: today,
          lte: nextWeek,
        },
        reminderDays: {
          not: null,
        },
      },
      include: {
        project: true,
        reminders: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    // Filter tasks that need reminders based on reminderDays
    const tasksNeedingReminders = tasks.filter((task) => {
      if (!task.dueDate || !task.reminderDays) return false;

      const dueDate = new Date(task.dueDate);
      const reminderDate = addDays(dueDate, -task.reminderDays);
      
      // Check if reminder should be sent (reminder date is today or earlier)
      // and hasn't been sent yet
      const isReminderDue = reminderDate <= now;
      const hasBeenSent = task.reminders.some(
        (r) => r.isSent && r.reminderDate >= reminderDate
      );

      return isReminderDue && !hasBeenSent;
    });

    return NextResponse.json({ tasks: tasksNeedingReminders });
  } catch (error) {
    console.error("Get reminders error:", error);
    return NextResponse.json(
      { error: "Failed to get reminders" },
      { status: 500 }
    );
  }
}

// Mark reminder as sent
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId: user.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Create reminder record
    const reminder = await prisma.taskReminder.create({
      data: {
        taskId,
        reminderDate: new Date(),
        isSent: true,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, reminder });
  } catch (error) {
    console.error("Mark reminder error:", error);
    return NextResponse.json(
      { error: "Failed to mark reminder" },
      { status: 500 }
    );
  }
}
