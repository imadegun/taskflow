import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId, subtaskId } = await params;
    const { title, completed } = await request.json();

    // Verify task belongs to user
    const task = await db.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update subtask
    const updateData: { title?: string; completed?: boolean } = {};
    if (title !== undefined) updateData.title = title;
    if (completed !== undefined) updateData.completed = completed;

    await db.subtask.update({
      where: { id: subtaskId, taskId },
      data: updateData,
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
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId, subtaskId } = await params;

    // Verify task belongs to user
    const task = await db.task.findFirst({
      where: { id: taskId, userId: session.user.id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.subtask.delete({
      where: { id: subtaskId, taskId },
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
    console.error("Error deleting subtask:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
