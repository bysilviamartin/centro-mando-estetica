"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getServices() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: "asc" }
    });
    return { success: true, data: services };
  } catch (error: any) {
    console.error("Error fetching services:", error);
    return { success: false, error: error.message };
  }
}

export async function createService(data: {
  reference?: string;
  name: string;
  price?: number;
  duration?: number;
  category?: string;
  taxRate?: number;
  active?: boolean;
  details?: string;
  showOnline?: boolean;
  employees?: string;
  tariffs?: string;
  productCost?: number;
  disposableCost?: number;
  equipmentCost?: number;
}) {
  try {
    const service = await prisma.service.create({
      data: {
        ...data,
      }
    });
    revalidatePath("/services");
    return { success: true, data: service };
  } catch (error: any) {
    console.error("Error creating service:", error);
    return { success: false, error: error.message };
  }
}

export async function updateService(id: string, data: Partial<{
  reference?: string;
  name: string;
  price?: number;
  duration?: number;
  category?: string;
  taxRate?: number;
  active?: boolean;
  details?: string;
  showOnline?: boolean;
  employees?: string;
  tariffs?: string;
  productCost?: number;
  disposableCost?: number;
  equipmentCost?: number;
}>) {
  try {
    const service = await prisma.service.update({
      where: { id },
      data
    });
    revalidatePath("/services");
    return { success: true, data: service };
  } catch (error: any) {
    console.error("Error updating service:", error);
    return { success: false, error: error.message };
  }
}

export async function importServices(services: any[]) {
  try {
    let importedCount = 0;
    
    // We will use a transaction to process all services
    await prisma.$transaction(async (tx) => {
      for (const service of services) {
        if (!service.name) continue;
        
        // Upsert by name, but we could also use reference if provided and unique
        await tx.service.upsert({
          where: { name: service.name },
          update: {
            ...service,
          },
          create: {
            ...service,
          }
        });
        
        importedCount++;
      }
    });

    revalidatePath("/services");
    return { success: true, count: importedCount };
  } catch (error: any) {
    console.error("Error importing services:", error);
    return { success: false, error: error.message };
  }
}
