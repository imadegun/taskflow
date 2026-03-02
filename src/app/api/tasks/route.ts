import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const filter = searchParams.get("filter");
    const search = searchParams.get("search");

    const where: {
      userId: string;
      projectId?: string | null;
      completed?: boolean;
      dueDate?: { gte: Date; lt: Date };
      OR?: Array<{ title: { contains: string } } | { description: { contains: string } }>;
    } = {
      userId: session.user.id,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (filter === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.dueDate = {
        gte: today,
        lt: tomorrow,
      };
    }

    if (filter === "completed") {
      where.completed = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        project: true,
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: {
          orderBy: { order: "asc" },
        },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
        reminders: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ completed: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, priority, dueDate, reminderDays, projectId, labelIds, subtasks, attachments } =
      await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Get the max order for tasks in this project
    const maxOrder = await db.task.aggregate({
      where: {
        userId: session.user.id,
        projectId: projectId || null,
      },
      _max: { order: true },
    });

    const task = await db.task.create({
      data: {
        title,
        description,
        priority: priority || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        reminderDays: reminderDays || null,
        projectId: projectId || null,
        userId: session.user.id,
        order: (maxOrder._max.order || 0) + 1,
        labels: labelIds
          ? {
              create: labelIds.map((labelId: string) => ({
                labelId,
              })),
            }
          : undefined,
        subtasks: subtasks
          ? {
              create: subtasks.map((subtask: { title: string; order: number }) => ({
                title: subtask.title,
                order: subtask.order,
              })),
            }
          : undefined,
        attachments: attachments
          ? {
              create: attachments.map((att: { fileName: string; fileUrl: string; fileType: string; fileSize: number }) => ({
                fileName: att.fileName,
                fileUrl: att.fileUrl,
                fileType: att.fileType,
                fileSize: att.fileSize,
              })),
            }
          : undefined,
      },
      include: {
        project: true,
        labels: {
          include: {
            label: true,
          },
        },
        subtasks: {
          orderBy: { order: "asc" },
        },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
        reminders: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
