"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEquipments() {
  try {
    const equipments = await prisma.equipment.findMany({
      orderBy: { name: "asc" }
    });
    return { success: true, data: equipments };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error fetching equipments:", error);
    return { success: false, error: error.message };
  }
}

export async function getEquipmentById(id: string) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { name: "asc" }
        }
      }
    });
    if (!equipment) return { success: false, error: "Aparatología no encontrada" };
    return { success: true, data: equipment };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error fetching equipment details:", error);
    return { success: false, error: error.message };
  }
}

export async function createEquipment(data: {
  name: string;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  active?: boolean;
  notes?: string | null;
}) {
  try {
    if (!data.name || data.name.trim() === "") {
      return { success: false, error: "El nombre es obligatorio" };
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: data.name,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        active: data.active ?? true,
        notes: data.notes
      }
    });

    revalidatePath("/settings/equipment");
    return { success: true, data: equipment };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error creating equipment:", error);
    return { success: false, error: error.message };
  }
}

export async function updateEquipment(id: string, data: {
  name?: string;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  active?: boolean;
  notes?: string | null;
}) {
  try {
    const equipment = await prisma.equipment.update({
      where: { id },
      data
    });

    revalidatePath("/settings");
    revalidatePath(`/settings/equipment/${id}`);
    revalidatePath("/settings/equipment");
    return { success: true, data: equipment };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error updating equipment:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteEquipment(id: string) {
  try {
    await prisma.equipment.delete({
      where: { id }
    });
    
    revalidatePath("/settings/equipment");
    return { success: true };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error deleting equipment:", error);
    return { success: false, error: error.message };
  }
}

export async function linkServiceToEquipment(equipmentId: string, serviceId: string) {
  try {
    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        services: {
          connect: { id: serviceId }
        }
      },
      include: {
        services: true
      }
    });

    revalidatePath(`/settings/equipment/${equipmentId}`);
    return { success: true, data: equipment };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error linking service:", error);
    return { success: false, error: error.message };
  }
}

export async function unlinkServiceFromEquipment(equipmentId: string, serviceId: string) {
  try {
    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        services: {
          disconnect: { id: serviceId }
        }
      },
      include: {
        services: true
      }
    });

    revalidatePath(`/settings/equipment/${equipmentId}`);
    return { success: true, data: equipment };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error unlinking service:", error);
    return { success: false, error: error.message };
  }
}

export async function linkServicesByCategoryToEquipment(equipmentId: string, category: string) {
  try {
    const servicesToLink = await prisma.service.findMany({
      where: {
        category,
        equipments: {
          none: { id: equipmentId }
        }
      },
      select: { id: true }
    });

    if (servicesToLink.length === 0) {
      return { success: true, count: 0, message: "No hay nuevos servicios en esta familia para añadir." };
    }

    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        services: {
          connect: servicesToLink.map(s => ({ id: s.id }))
        }
      },
      include: {
        services: {
          orderBy: { name: "asc" }
        }
      }
    });

    revalidatePath(`/settings/equipment/${equipmentId}`);
    return { success: true, data: equipment, count: servicesToLink.length };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error linking services by category:", error);
    return { success: false, error: error.message };
  }
}

export async function getEquipmentProfitabilitySales(equipmentId: string) {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { services: true }
    });

    if (!equipment) return { success: false, error: "Equipo no encontrado" };

    const serviceReferences = equipment.services
      .map(s => s.reference)
      .filter(Boolean) as string[];

    if (serviceReferences.length === 0) {
      return { success: true, data: [] };
    }

    const sales = await prisma.importedSale.findMany({
      where: {
        reference: { in: serviceReferences }
      },
      orderBy: {
        date: "desc"
      }
    });

    return { success: true, data: sales };
  } catch (error: any) {
    console.error("[SERVER ACTION] Error fetching equipment sales:", error);
    return { success: false, error: error.message };
  }
}
