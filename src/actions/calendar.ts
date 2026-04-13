"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCalendarEvents() {
  try {
    const events = await prisma.calendarEvent.findMany({
      orderBy: {
        startDate: 'asc'
      }
    });
    
    // We parse Date objects to ISO strings for client consumption securely
    return { 
      success: true, 
      events: events.map((event: any) => ({
        ...event,
        startDate: event.startDate.toISOString().split('T')[0],
        endDate: event.endDate.toISOString().split('T')[0],
        originalStatus: event.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
      })) 
    };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to fetch calendar events:", error);
    return { success: false, error: error.message };
  }
}

export async function getWorkerVacationsForCalendar() {
  try {
    const vacations = await prisma.workerVacation.findMany({
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    return { 
      success: true, 
      vacations: vacations.map((v: any) => ({
        id: `worker-vacation-${v.id}`,
        originalId: v.id,
        workerId: v.worker.id,
        title: `Vacaciones: ${v.worker.firstName} ${v.worker.lastName.charAt(0)}.`,
        startDate: v.startDate.toISOString().split('T')[0],
        endDate: v.endDate.toISOString().split('T')[0],
        type: 'VACACIONES_TRABAJADORA',
        recurrence: 'NONE',
        status: v.status === 'Cancelada' ? 'INACTIVE' : 'ACTIVE',
        originalStatus: v.status,
      }))
    };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to fetch worker vacations:", error);
    return { success: false, error: error.message };
  }
}

export async function getWorkerAbsencesForCalendar() {
  try {
    const absences = await prisma.workerAbsence.findMany({
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    return { 
      success: true, 
      absences: absences.map((a: any) => ({
        id: `worker-absence-${a.id}`,
        originalId: a.id,
        workerId: a.worker.id,
        title: `${a.type}: ${a.worker.firstName} ${a.worker.lastName.charAt(0)}.`,
        startDate: a.startDate.toISOString().split('T')[0],
        endDate: a.endDate.toISOString().split('T')[0],
        type: 'AUSENCIA_TRABAJADORA',
        recurrence: 'NONE',
        status: a.status === 'Cerrada' ? 'INACTIVE' : 'ACTIVE',
        originalStatus: a.status,
      }))
    };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to fetch worker absences:", error);
    return { success: false, error: error.message };
  }
}

export async function createCalendarEvent(data: any) {
  try {
    const start = new Date(data.startDate);
    const end = data.endDate ? new Date(data.endDate) : start;

    const event = await prisma.calendarEvent.create({
      data: {
        type: data.type,
        title: data.title,
        startDate: start,
        endDate: end,
        recurrence: data.recurrence || "NONE",
        status: data.status || "ACTIVE"
      }
    });

    revalidatePath("/settings/calendar");
    
    return { 
      success: true, 
      event: {
        ...event,
        startDate: event.startDate.toISOString().split('T')[0],
        endDate: event.endDate.toISOString().split('T')[0]
      }
    };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to create calendar event:", error);
    return { success: false, error: error.message };
  }
}

export async function updateCalendarEvent(id: string, data: any) {
  try {
    const start = new Date(data.startDate);
    const end = data.endDate ? new Date(data.endDate) : start;

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
        type: data.type,
        title: data.title,
        startDate: start,
        endDate: end,
        recurrence: data.recurrence || "NONE",
        status: data.status || "ACTIVE"
      }
    });

    revalidatePath("/settings/calendar");
    
    return { 
      success: true, 
      event: {
        ...event,
        startDate: event.startDate.toISOString().split('T')[0],
        endDate: event.endDate.toISOString().split('T')[0]
      }
    };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to update calendar event:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCalendarEvent(id: string) {
  try {
    await prisma.calendarEvent.delete({
      where: { id }
    });

    revalidatePath("/settings/calendar");
    
    return { success: true };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to delete calendar event:", error);
    return { success: false, error: error.message };
  }
}
