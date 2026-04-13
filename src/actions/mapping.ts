"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createClassificationRuleAndApply(
  movementId: string,
  keyword: string,
  targetType: string,
  targetFiscalRule: string,
  targetField: string = "full_description"
) {
  try {
    // 1. Create the new classification rule
    const newRule = await prisma.classificationRule.create({
      data: {
        keyword,
        targetType,
        targetFiscalRule,
        targetField,
        // targetId is null for V1, leaving catalog linkage for later phases
      },
    });

    // 2. Fetch the sale line to determine rigid fiscal flags
    const saleLine = await prisma.importedSale.findUnique({
      where: { id: movementId }
    });

    if (!saleLine) return { success: false, error: "Línea de venta no encontrada" };

    // 3. Evaluate fiscal flags based on the new explicit rule choice
    let countsAsRevenue = false;
    let generatesVat = false;
    let vatAlreadyRecognized = false;

    switch (targetFiscalRule) {
      case "normal_taxable_sale":
        countsAsRevenue = true;
        generatesVat = true;
        break;
      case "prepaid_voucher_sale":
        countsAsRevenue = true;
        generatesVat = true;
        break;
      case "voucher_session_consumption":
        countsAsRevenue = false;
        generatesVat = false;
        vatAlreadyRecognized = true;
        break;
      case "debt_payment":
        countsAsRevenue = false;
        generatesVat = false;
        break;
      case "gift_card_sale":
        countsAsRevenue = true;
        generatesVat = true; // VAT is triggered AT sale now
        break;
      case "gift_card_redemption":
        countsAsRevenue = false; // Already counted as revenue when sold
        generatesVat = false; // VAT was already triggered when sold
        break;
      case "customer_balance_usage":
        countsAsRevenue = false;
        generatesVat = false;
        break;
      case "refund":
        countsAsRevenue = true; // Yes, but math handles it since the row should have negative totalAmount
        generatesVat = true; // math handles negative taxAmount
        break;
      case "adjustment":
        countsAsRevenue = false;
        generatesVat = false;
        break;
    }

    // 4. Update the imported sale immediately
    const updatedSale = await prisma.importedSale.update({
      where: { id: movementId },
      data: {
        classifiedType: targetType,
        classificationStatus: "classified",
        fiscalRuleType: targetFiscalRule,
        countsAsRevenue,
        generatesVat,
        vatAlreadyRecognized,
      }
    });
    
    // 5. Retroactively apply the new rule to other pending sales with the EXACT same description
    await prisma.importedSale.updateMany({
      where: { 
        classificationStatus: "pending_review",
        description: {
          contains: keyword
        }
      },
      data: {
        classifiedType: targetType,
        classificationStatus: "classified",
        fiscalRuleType: targetFiscalRule,
        countsAsRevenue,
        generatesVat,
        vatAlreadyRecognized,
      }
    });

    revalidatePath("/review");
    revalidatePath("/cash");
    revalidatePath("/");

    return { success: true, rule: newRule };

  } catch (error: any) {
    if (error.code === 'P2002') {
       return { success: false, error: "La palabra clave (keyword) ya existe en otra regla." };
    }
    console.error("Error creating mapping", error);
    return { success: false, error: error.message };
  }
}

export async function deleteClassificationRule(id: string) {
  try {
    await prisma.classificationRule.delete({
      where: { id },
    });
    revalidatePath("/rules");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleClassificationRule(id: string, active: boolean) {
  try {
    const updated = await prisma.classificationRule.update({
      where: { id },
      data: { active },
    });
    revalidatePath("/rules");
    return { success: true, rule: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateClassificationRule(id: string, data: any) {
  try {
    const updated = await prisma.classificationRule.update({
      where: { id },
      data: {
        keyword: data.keyword,
        targetType: data.targetType,
        targetFiscalRule: data.targetFiscalRule,
      },
    });
    revalidatePath("/rules");
    return { success: true, rule: updated };
  } catch (error: any) {
    if (error.code === 'P2002') {
       return { success: false, error: "La palabra clave ya existe." };
    }
    return { success: false, error: error.message };
  }
}
