import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Verify task belongs to user
    const task = await db.task.findFirst({
      where: { id: taskId, userId: session.user.id },
      include: { subtasks: { orderBy: { order: "desc" }, take: 1 } },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const maxOrder = task.subtasks[0]?.order || 0;

    await db.subtask.create({
      data: {
        title,
        taskId,
        order: maxOrder + 1,
      },
    });

    // Return updated task
    const updatedTask = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        labels: { include: { label: true } },
        subtasks: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
