"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getWorkers() {
  try {
    const workers = await prisma.worker.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { 
      success: true, 
      workers: workers 
    };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to fetch workers:", error);
    return { success: false, error: error.message };
  }
}

export async function getWorkerById(id: string) {
  try {
    let worker;
    
    // Intentamos cargar con vacaciones (puede fallar si Prisma Client no se generó por bloqueo en Windows)
    try {
      worker = await prisma.worker.findUnique({
        where: { id },
        include: {
          vacations: {
            orderBy: { startDate: 'desc' }
          },
          absences: {
            orderBy: { startDate: 'desc' }
          }
        }
      });
    } catch (e) {
      console.warn("[WARNING] No se pudo incluir 'vacations' (Prisma Client desactualizado por bloqueo). Cargando trabajador base.");
      
      worker = await prisma.worker.findUnique({
        where: { id }
      });
      
      if (worker) {
        // mockeamos el array para que el frontend no rompa
        (worker as any).vacations = [];
        (worker as any).absences = [];
      }
    }

    if (!worker) {
      return { success: false, error: "Trabajadora no encontrada." };
    }

    return { success: true, worker };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to fetch worker:", error);
    return { success: false, error: error.message };
  }
}

export async function createWorker(data: any) {
  try {
    // Basic validation
    if (!data.firstName || !data.lastName) {
      throw new Error("Nombre y apellidos son obligatorios.");
    }

    const worker = await prisma.worker.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate || null,
        phone: data.mobile || null,
        email: data.email || null,
        hireDate: data.onboardDate || null,
        contractType: data.contractType || "Indefinido",
        servicesPlaceholder: null, // Reserved for future phase
        status: data.status || "Activa",
      }
    });

    // Revalidate the workers settings page
    revalidatePath("/settings/workers");

    return { success: true, worker };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to create worker:", error);
    return { success: false, error: error.message };
  }
}

export async function updateWorker(id: string, data: any) {
  try {
    if (!data.firstName || !data.lastName) {
      throw new Error("Nombre y apellidos son obligatorios.");
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate || null;
    if (data.mobile !== undefined) updateData.phone = data.mobile || null;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.onboardDate !== undefined) updateData.hireDate = data.onboardDate || null;
    if (data.contractType !== undefined) updateData.contractType = data.contractType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.vacationDays !== undefined) updateData.vacationDays = parseInt(data.vacationDays, 10);
    if (data.monthlyCost !== undefined) updateData.monthlyCost = parseFloat(data.monthlyCost) || 0;
    if (data.weeklyHours !== undefined) updateData.weeklyHours = parseFloat(data.weeklyHours) || 0;
    if (data.targetMinimum !== undefined) updateData.targetMinimum = parseFloat(data.targetMinimum) || 0;
    if (data.targetHealthy !== undefined) updateData.targetHealthy = parseFloat(data.targetHealthy) || 0;

    const worker = await prisma.worker.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/settings/workers");

    return { success: true, worker };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to update worker:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteWorker(id: string) {
  try {
    await prisma.worker.delete({
      where: { id }
    });

    revalidatePath("/settings/workers");
    
    return { success: true };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to delete worker:", error);
    return { success: false, error: error.message };
  }
}

export async function updateWorkerVacationDays(id: string, vacationDays: number) {
  try {
    const worker = await prisma.worker.update({
      where: { id },
      data: { vacationDays: parseInt(vacationDays as any, 10) }
    });

    revalidatePath(`/settings/workers/${id}`);
    revalidatePath("/settings/workers");
    
    return { success: true, worker };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to update vacation days:", error);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// WORKER VACATIONS
// ----------------------------------------------------

export async function createWorkerVacation(workerId: string, data: any) {
  try {
    if (!data.startDate || !data.endDate) {
      throw new Error("Fechas de inicio y fin son obligatorias.");
    }
    
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error("La fecha de fin no puede ser anterior a la de inicio.");
    }

    const vacation = await prisma.workerVacation.create({
      data: {
        workerId: workerId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || "Aprobada",
        notes: data.notes || null,
      }
    });

    revalidatePath(`/settings/workers/${workerId}`);
    return { success: true, vacation };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to create vacation:", error);
    return { success: false, error: error.message };
  }
}

export async function updateWorkerVacation(id: string, workerId: string, data: any) {
  try {
    if (!data.startDate || !data.endDate) {
      throw new Error("Fechas de inicio y fin son obligatorias.");
    }

    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error("La fecha de fin no puede ser anterior a la de inicio.");
    }

    const vacation = await prisma.workerVacation.update({
      where: { id },
      data: {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || "Aprobada",
        notes: data.notes || null,
      }
    });

    revalidatePath(`/settings/workers/${workerId}`);
    return { success: true, vacation };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to update vacation:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteWorkerVacation(id: string, workerId: string) {
  try {
    await prisma.workerVacation.delete({
      where: { id }
    });

    revalidatePath(`/settings/workers/${workerId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to delete vacation:", error);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// WORKER ABSENCES
// ----------------------------------------------------

export async function getWorkerAbsences(workerId: string) {
  try {
    if (!prisma.workerAbsence) {
      throw new Error("El modelo Prisma está desactualizado en memoria. Detén tu terminal (Ctrl+C), ejecuta 'npx prisma generate' y vuelve a lanzar 'npm run dev'.");
    }

    const absences = await prisma.workerAbsence.findMany({
      where: { workerId },
      orderBy: { startDate: 'desc' }
    });
    return { success: true, absences };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to fetch worker absences:", error);
    return { success: false, error: error.message };
  }
}

export async function createWorkerAbsence(workerId: string, data: any) {
  try {
    if (!data.type || !data.startDate || !data.endDate) {
      throw new Error("Tipo, y fechas de inicio y fin son obligatorios.");
    }
    
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error("La fecha de fin no puede ser anterior a la de inicio.");
    }

    if (!prisma.workerAbsence) {
      throw new Error("El modelo Prisma está desactualizado en memoria. Detén tu terminal (Ctrl+C), ejecuta 'npx prisma generate' y vuelve a lanzar 'npm run dev'.");
    }

    const absence = await prisma.workerAbsence.create({
      data: {
        workerId: workerId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || "Activa",
        notes: data.notes || null,
      }
    });

    revalidatePath(`/settings/workers/${workerId}`);
    return { success: true, absence };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to create absence:", error);
    return { success: false, error: error.message };
  }
}

export async function updateWorkerAbsence(id: string, workerId: string, data: any) {
  try {
    if (!data.type || !data.startDate || !data.endDate) {
      throw new Error("Tipo, y fechas de inicio y fin son obligatorios.");
    }

    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new Error("La fecha de fin no puede ser anterior a la de inicio.");
    }

    if (!prisma.workerAbsence) {
      throw new Error("El modelo Prisma está desactualizado en memoria. Detén tu terminal (Ctrl+C), ejecuta 'npx prisma generate' y vuelve a lanzar 'npm run dev'.");
    }

    const absence = await prisma.workerAbsence.update({
      where: { id },
      data: {
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: data.status || "Activa",
        notes: data.notes || null,
      }
    });

    revalidatePath(`/settings/workers/${workerId}`);
    return { success: true, absence };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to update absence:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteWorkerAbsence(id: string, workerId: string) {
  try {
    if (!prisma.workerAbsence) {
      throw new Error("El modelo Prisma está desactualizado en memoria. Detén tu terminal (Ctrl+C), ejecuta 'npx prisma generate' y vuelve a lanzar 'npm run dev'.");
    }

    await prisma.workerAbsence.delete({
      where: { id }
    });

    revalidatePath(`/settings/workers/${workerId}`);
    return { success: true };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to delete absence:", error);
    return { success: false, error: error.message };
  }
}

export async function getWorkerSales(workerName: string, year: number, month: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    // Attempt relaxed matching logic against employeeName (could contain surname or exact name)
    const normalizedName = workerName.trim().split(" ")[0];

    const sales = await prisma.importedSale.findMany({
      where: {
        AND: [
          { employeeName: { contains: normalizedName } },
          { date: { gte: startDate, lte: endDate } }
        ]
      },
      orderBy: { date: "asc" }
    });
    
    return { success: true, count: sales.length, sales };
  } catch (error: any) {
    console.error("[SERVER ACTION] Failed to fetch worker sales:", error);
    return { success: false, error: error.message };
  }
}

