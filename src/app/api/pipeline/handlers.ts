// app/api/pipeline/handlers.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PipelineType, PipelineStage, PipelineStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, description, projectId } = body;
    
    if (!type || !title || !projectId) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, title, projectId' 
      }, { status: 400 });
    }

    // Validate pipeline type
    if (!Object.values(PipelineType).includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid pipeline type' 
      }, { status: 400 });
    }
    
    // Get default stage for the pipeline type
    const defaultStage = getDefaultStage(type);
    
    // Create the pipeline card
    const card = await prisma.pipelineCard.create({
      data: {
        projectId,
        type: type as PipelineType,
        stage: defaultStage,
        status: PipelineStatus.OPEN,
        title,
        notes: description || '',
      },
      include: {
        project: {
          include: {
            customer: true,
          }
        }
      }
    });
    
    // Create type-specific details record
    await createCardDetails(card.id, type as PipelineType);
    
    // Get the complete card with details
    const completeCard = await prisma.pipelineCard.findUnique({
      where: { id: card.id },
      include: {
        project: {
          include: {
            customer: true,
          }
        },
        salesDetails: type === PipelineType.SALES,
        designDetails: type === PipelineType.DESIGN,
        integrationDetails: type === PipelineType.INTEGRATION,
      }
    });
    
    revalidatePath(`/pipeline`);
    return NextResponse.json(completeCard);
  } catch (error) {
    console.error('Failed to create card:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to create card', 
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { cardId, stage, status, ...updates } = body;
    
    if (!cardId) {
      return NextResponse.json({ 
        error: 'Card ID is required' 
      }, { status: 400 });
    }
    
    // Find the existing card
    const existingCard = await prisma.pipelineCard.findUnique({
      where: { id: cardId }
    });
    
    if (!existingCard) {
      return NextResponse.json({ 
        error: 'Card not found' 
      }, { status: 404 });
    }
    
    // Update data
    const updateData = {
      ...(stage && { stage: stage as PipelineStage }),
      ...(status && { status: status as PipelineStatus }),
      ...updates,
      updatedAt: new Date(),
    };
    
    // Update the card
    const updatedCard = await prisma.pipelineCard.update({
      where: { id: cardId },
      data: updateData,
      include: {
        project: {
          include: {
            customer: true,
          }
        },
        salesDetails: existingCard.type === PipelineType.SALES,
        designDetails: existingCard.type === PipelineType.DESIGN,
        integrationDetails: existingCard.type === PipelineType.INTEGRATION,
      }
    });
    
    revalidatePath(`/pipeline`);
    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Failed to update card:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to update card', 
      details: errorMessage 
    }, { status: 500 });
  }
}

// Helper function to get the default stage for each pipeline type
function getDefaultStage(pipelineType: PipelineType): PipelineStage {
  switch (pipelineType) {
    case PipelineType.SALES:
      return PipelineStage.NEW_LEAD;
    case PipelineType.DESIGN:
      return PipelineStage.NEW_DESIGN;
    case PipelineType.INTEGRATION:
      return PipelineStage.APPROVED;
    case PipelineType.SERVICE:
      return PipelineStage.SERVICE_REQUEST;
    case PipelineType.RENTAL:
      return PipelineStage.RENTAL_REQUEST;
    default:
      return PipelineStage.NEW_LEAD;
  }
}

// Helper function to create type-specific details record
async function createCardDetails(cardId: string, pipelineType: PipelineType) {
  switch (pipelineType) {
    case PipelineType.SALES:
      await prisma.salesCardDetails.create({
        data: {
          cardId,
          estimatedValue: 0,
        }
      });
      break;
    case PipelineType.DESIGN:
      await prisma.designCardDetails.create({
        data: {
          cardId,
          estimatedHours: 0,
        }
      });
      break;
    case PipelineType.INTEGRATION:
      await prisma.integrationCardDetails.create({
        data: {
          cardId,
          approvedProposalValue: 0,
          depositAmount: 0,
          siteReadinessChecklistComplete: false,
        }
      });
      break;
    default:
      // No details for other types yet
      break;
  }
}