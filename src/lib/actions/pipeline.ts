// src/lib/actions/pipeline.ts
"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { TransactionClient } from "@/lib/prisma";
import { 
  PipelineStatus, 
  PipelineType, 
  PipelineStage 
} from "@prisma/client";
import { revalidatePath } from "next/cache";

// Define input schema for validation
const RequestDesignInput = z.object({
  salesCardId: z.string().cuid(), // Validate it's a CUID
});

export async function requestDesign(
  input: z.infer<typeof RequestDesignInput>
): Promise<{ success: boolean; error?: string; designCardId?: string }> {
  // Input Validation
  const validatedInput = RequestDesignInput.safeParse(input);
  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  const { salesCardId } = validatedInput.data;

  try {
    // Core Logic
    const salesCard = await prisma.pipelineCard.findUnique({
      where: { id: salesCardId },
    });

    // Validate the sales card state
    if (!salesCard) {
      return { success: false, error: "Sales card not found." };
    }
    if (salesCard.type !== PipelineType.SALES) {
      return { success: false, error: "Card is not a Sales card." };
    }
    if (salesCard.stage !== PipelineStage.APPOINTMENT_COMPLETE) {
      return { success: false, error: "Card not in correct stage." };
    }
    if (salesCard.status !== PipelineStatus.OPEN) {
      return { success: false, error: "Card is not open for action." };
    }

    // Database Transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Update Sales Card status
      await tx.pipelineCard.update({
        where: { id: salesCardId },
        data: { status: PipelineStatus.WAITING_DESIGN },
      });

      // 2. Create new Design Card
      const newDesignCard = await tx.pipelineCard.create({
        data: {
          projectId: salesCard.projectId, // Link to the same project
          type: PipelineType.DESIGN,
          stage: PipelineStage.NEW_DESIGN,
          status: PipelineStatus.OPEN,
          title: `DESIGN - ${salesCard.title}`, // Generate a default title
          originating_card_id: salesCardId, // Link back to the sales card
        },
      });

      // 3. Create DesignCardDetails record
      await tx.designCardDetails.create({
        data: {
          cardId: newDesignCard.id, // Link to the new Design card
        },
      });

      return newDesignCard; // Return the new card from the transaction
    });

    // Revalidation
    revalidatePath(`/pipeline`);

    return { success: true, designCardId: result.id };

  } catch (error) {
    console.error("Error requesting design:", error);
    if (error instanceof Error) {
      return { success: false, error: `Error: ${error.message}` };
    }
    return { success: false, error: "Failed to request design." };
  }
}

// Complete Design and update Sales card
const CompleteDesignInput = z.object({
  designCardId: z.string().cuid(),
});

export async function completeDesign(
  input: z.infer<typeof CompleteDesignInput>
): Promise<{ success: boolean; error?: string; salesCardId?: string }> {
  // Input Validation
  const validatedInput = CompleteDesignInput.safeParse(input);
  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  const { designCardId } = validatedInput.data;

  try {
    // Validate the design card state
    const designCard = await prisma.pipelineCard.findUnique({
      where: { id: designCardId },
      include: {
        designDetails: true,
      },
    });

    if (!designCard) {
      return { success: false, error: "Design card not found." };
    }
    if (designCard.type !== PipelineType.DESIGN) {
      return { success: false, error: "Card is not a Design card." };
    }
    if (designCard.stage !== PipelineStage.DESIGN_VERIFICATION) {
      return { success: false, error: "Design card must be in DESIGN_VERIFICATION stage." };
    }

    // Find the originating Sales card
    if (!designCard.originating_card_id) {
      return { success: false, error: "Design card is not linked to a Sales card." };
    }

    const salesCard = await prisma.pipelineCard.findUnique({
      where: { id: designCard.originating_card_id },
    });

    if (!salesCard) {
      return { success: false, error: "Linked Sales card not found." };
    }
    if (salesCard.type !== PipelineType.SALES) {
      return { success: false, error: "Linked card is not a Sales card." };
    }

    // Database Transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Update Design Card stage and status
      await tx.pipelineCard.update({
        where: { id: designCardId },
        data: {
          stage: PipelineStage.DESIGN_COMPLETE,
          status: PipelineStatus.CLOSED,
        },
      });

      // 2. Update Sales Card stage and status
      await tx.pipelineCard.update({
        where: { id: salesCard.id },
        data: {
          stage: PipelineStage.PROPOSAL, // Move to PROPOSAL stage
          status: PipelineStatus.OPEN, // Change from WAITING_DESIGN back to OPEN
        },
      });

      return salesCard;
    });

    // Revalidation
    revalidatePath(`/pipeline`);

    return { success: true, salesCardId: result.id };
  } catch (error) {
    console.error("Error completing design:", error);
    if (error instanceof Error) {
      return { success: false, error: `Error: ${error.message}` };
    }
    return { success: false, error: "Failed to complete design process." };
  }
}

// Create Integration card from Won Sales card
const CreateIntegrationInput = z.object({
  salesCardId: z.string().cuid(),
});

export async function createIntegration(
  input: z.infer<typeof CreateIntegrationInput>
): Promise<{ success: boolean; error?: string; integrationCardId?: string }> {
  // Input Validation
  const validatedInput = CreateIntegrationInput.safeParse(input);
  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  const { salesCardId } = validatedInput.data;

  try {
    // Validate the sales card state
    const salesCard = await prisma.pipelineCard.findUnique({
      where: { id: salesCardId },
      include: {
        salesDetails: true,
      },
    });

    if (!salesCard) {
      return { success: false, error: "Sales card not found." };
    }
    if (salesCard.type !== PipelineType.SALES) {
      return { success: false, error: "Card is not a Sales card." };
    }
    if (salesCard.stage !== PipelineStage.WON) {
      return { success: false, error: "Sales card must be in WON stage." };
    }
    if (salesCard.status !== PipelineStatus.OPEN) {
      return { success: false, error: "Sales card is not in OPEN status." };
    }

    // Database Transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Update Sales Card status
      await tx.pipelineCard.update({
        where: { id: salesCardId },
        data: {
          status: PipelineStatus.CLOSED, // Close the sales card
        },
      });

      // 2. Create new Integration Card
      const newIntegrationCard = await tx.pipelineCard.create({
        data: {
          projectId: salesCard.projectId, // Link to the same project
          type: PipelineType.INTEGRATION,
          stage: PipelineStage.APPROVED,
          status: PipelineStatus.OPEN,
          title: `INTEGRATION - ${salesCard.title}`,
          originating_card_id: salesCardId, // Link back to the sales card
        },
      });

      // 3. Create IntegrationCardDetails record
      // Extract estimated value from sales details if available
      const approvedValue = salesCard.salesDetails?.estimatedValue || 0;
      
      await tx.integrationCardDetails.create({
        data: {
          cardId: newIntegrationCard.id,
          approvedProposalValue: approvedValue,
          depositAmount: approvedValue * 0.5, // Default to 50% deposit
          siteReadinessChecklistComplete: false,
        },
      });

      return newIntegrationCard;
    });

    // Revalidation
    revalidatePath(`/pipeline`);

    return { success: true, integrationCardId: result.id };
  } catch (error) {
    console.error("Error creating integration card:", error);
    if (error instanceof Error) {
      return { success: false, error: `Error: ${error.message}` };
    }
    return { success: false, error: "Failed to create integration card." };
  }
}