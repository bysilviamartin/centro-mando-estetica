"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createInternalTransfer(
  sourceAccountId: string,
  destinationAccountId: string,
  amount: number,
  description: string,
  date: Date,
  documents: {name: string; url: string}[] = []
) {
  try {
    const transfer = await prisma.treasuryMovement.create({
      data: {
        type: "internal_transfer",
        sourceAccountId,
        destinationAccountId,
        amount,
        description,
        date,
        documents: documents.length > 0 ? {
          create: documents.map(doc => ({ name: doc.name, url: doc.url }))
        } : undefined
      }
    });
    revalidatePath("/treasury");
    return { success: true, transfer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createExternalInflow(
  destinationAccountId: string,
  amount: number,
  description: string,
  externalEntity: string,
  date: Date,
  documents: {name: string; url: string}[] = []
) {
  try {
    const inflow = await prisma.treasuryMovement.create({
      data: {
        type: "inflow",
        destinationAccountId,
        amount,
        description,
        externalEntity,
        date,
        documents: documents.length > 0 ? {
          create: documents.map(doc => ({ name: doc.name, url: doc.url }))
        } : undefined
      }
    });
    revalidatePath("/treasury");
    // Also revalidate dashboard and cash as this is real money in
    revalidatePath("/");
    revalidatePath("/cash");
    return { success: true, inflow };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createExternalOutflow(
  sourceAccountId: string,
  amount: number,
  description: string,
  externalEntity: string,
  date: Date,
  documents: {name: string; url: string}[] = []
) {
  try {
    const outflow = await prisma.treasuryMovement.create({
      data: {
        type: "outflow",
        sourceAccountId,
        amount,
        description,
        externalEntity,
        date,
        documents: documents.length > 0 ? {
          create: documents.map(doc => ({ name: doc.name, url: doc.url }))
        } : undefined
      }
    });
    revalidatePath("/treasury");
    revalidatePath("/");
    return { success: true, outflow };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAccount(id: string, name: string, initialBalance: number) {
  try {
    const account = await prisma.account.update({
      where: { id },
      data: { name, initialBalance }
    });
    revalidatePath("/treasury");
    return { success: true, account };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTreasuryAdjustment(
  accountId: string,
  amount: number, // positive or negative
  description: string,
  date: Date,
  documents: {name: string; url: string}[] = []
) {
  try {
    const isPositive = amount >= 0;
    const adjMovement = await prisma.treasuryMovement.create({
      data: {
        type: isPositive ? "inflow" : "outflow",
        destinationAccountId: isPositive ? accountId : undefined,
        sourceAccountId: !isPositive ? accountId : undefined,
        amount: Math.abs(amount),
        description: `Ajuste Saldo: ${description}`,
        isAdjustment: true,
        date,
        documents: documents.length > 0 ? {
          create: documents.map(doc => ({ name: doc.name, url: doc.url }))
        } : undefined
      }
    });
    revalidatePath("/treasury");
    return { success: true, movement: adjMovement };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
