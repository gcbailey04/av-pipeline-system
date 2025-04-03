// lib/actions/pipeline.ts
"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client"; // Import Prisma types if needed for complex queries later
import { auth } from "@/lib/auth"; // Assuming your NextAuth config is here
import { prisma } from "@/lib/db"; // Your Prisma client instance
import {
  PipelineStatus,
  PipelineType,
  PipelineStage,
} from "@prisma/client"; // Import Enums
import { revalidatePath } from "next/cache"; // To refresh pipeline views

// Define input schema for validation
const RequestDesignInput = z.object({
  salesCardId: z.string().cuid(), // Validate it's a CUID
});

export async function requestDesign(
  input: z.infer<typeof RequestDesignInput>
): Promise<{ success: boolean; error?: string; designCardId?: string }> {
  // --- Authentication & Authorization ---
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated." };
  }
  // Basic authorization: Could add role checks later if needed

  // --- Input Validation ---
  const validatedInput = RequestDesignInput.safeParse(input);
  if (!validatedInput.success) {
    return { success: false, error: "Invalid input." };
  }
  const { salesCardId } = validatedInput.data;

  try {
    // --- Core Logic ---
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

    // --- Database Transaction ---
    const result = await prisma.$transaction(async (tx) => {
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
          // assignedUserId: null, // Assign later if needed
        },
      });

      // 3. Create DesignCardDetails record
      await tx.designCardDetails.create({
        data: {
          cardId: newDesignCard.id, // Link to the new Design card
          // designRequirements: null, // Populate later from Project notes maybe
          // assignedDesignerId: null, // Assign later
        },
      });

      return newDesignCard; // Return the new card from the transaction
    });

    // --- Revalidation ---
    // Revalidate the paths for relevant pipelines to update the UI
    revalidatePath(`/pipelines/SALES`);
    revalidatePath(`/pipelines/DESIGN`);
    // Optional: Could revalidate the specific project page too
    // revalidatePath(`/projects/${salesCard.projectId}`);

    return { success: true, designCardId: result.id };

  } catch (error) {
    console.error("Error requesting design:", error);
    // Handle potential Prisma errors or other exceptions
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors if needed
        return { success: false, error: `Database error: ${error.code}` };
    }
    return { success: false, error: "Failed to request design." };
  }
}