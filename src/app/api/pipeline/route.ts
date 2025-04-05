// src/app/api/pipeline/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PipelineType, PipelineStage, PipelineStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { stageToDisplayName } from '@/lib/column-helpers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type')?.toUpperCase();

  // Validate the pipeline type
  if (!typeParam || !Object.values(PipelineType).includes(typeParam as PipelineType)) {
    return NextResponse.json({ 
      error: 'Valid pipeline type is required (SALES, DESIGN, INTEGRATION, SERVICE, or RENTAL)' 
    }, { status: 400 });
  }

  // Convert string type to enum
  const pipelineType = typeParam as PipelineType;

  try {
    console.log('Fetching pipeline for type:', pipelineType);
    
    // Fetch pipeline cards with the appropriate relations
    const cards = await prisma.pipelineCard.findMany({
      where: { 
        type: pipelineType
      },
      include: {
        project: {
          include: {
            customer: true,
          }
        },
        salesDetails: pipelineType === PipelineType.SALES,
        designDetails: pipelineType === PipelineType.DESIGN,
        integrationDetails: pipelineType === PipelineType.INTEGRATION,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Group cards by stage
    const cardsByStage: Record<string, any[]> = {};
    
    // Get all relevant stages for this pipeline type
    const relevantStages = getPipelineStages(pipelineType);
    
    // Initialize all stages to ensure we have columns even for empty stages
    relevantStages.forEach(stage => {
      cardsByStage[stage] = [];
    });
    
    // Add cards to their respective stages
    cards.forEach(card => {
      if (!cardsByStage[card.stage]) {
        cardsByStage[card.stage] = [];
      }
      cardsByStage[card.stage].push(card);
    });
    
    // Convert to array format for the frontend
    const columns = Object.entries(cardsByStage).map(([stage, cards]) => ({
      id: stage,
      title: stageToDisplayName(stage as PipelineStage),
      cards
    }));
    
    return NextResponse.json(columns);
  } catch (error) {
    console.error('Failed to get pipeline:', error);
    
    // Proper error handling with type safety
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return NextResponse.json({ 
      error: 'Failed to fetch pipeline data', 
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, description, projectId } = body;
    
    console.log('Creating new card with data:', body);
    
    if (!type || !title) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, title' 
      }, { status: 400 });
    }

    // Validate pipeline type
    if (!Object.values(PipelineType).includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid pipeline type' 
      }, { status: 400 });
    }
    
    // Verify project exists or create a default one
    let actualProjectId = projectId;
    
    if (!actualProjectId) {
      // Create a default project if none exists
      console.log('No project ID provided, creating a default project');
      const defaultProject = await createDefaultProject();
      actualProjectId = defaultProject.id;
    } else {
      // Verify the project exists
      const project = await prisma.project.findUnique({
        where: { id: actualProjectId }
      });
      
      if (!project) {
        console.log('Project ID not found, creating a default project');
        const defaultProject = await createDefaultProject();
        actualProjectId = defaultProject.id;
      }
    }
    
    // Get default stage for the pipeline type
    const pipelineTypeEnum = type as PipelineType;
    const defaultStage = getDefaultStage(pipelineTypeEnum);
    
    console.log('Creating card with project ID:', actualProjectId);
    
    // Create the pipeline card
    const card = await prisma.pipelineCard.create({
      data: {
        projectId: actualProjectId,
        type: pipelineTypeEnum,
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
    await createCardDetails(card.id, pipelineTypeEnum);
    
    // Get the complete card with details
    const completeCard = await prisma.pipelineCard.findUnique({
      where: { id: card.id },
      include: {
        project: {
          include: {
            customer: true,
          }
        },
        salesDetails: pipelineTypeEnum === PipelineType.SALES,
        designDetails: pipelineTypeEnum === PipelineType.DESIGN,
        integrationDetails: pipelineTypeEnum === PipelineType.INTEGRATION,
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
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };
    
    if (stage) {
      // Convert from display name to enum if needed
      const stageValue = typeof stage === 'string' && !Object.values(PipelineStage).includes(stage as PipelineStage)
        ? findStageEnumFromDisplayName(stage, existingCard.type as PipelineType)
        : stage;
        
      updateData.stage = stageValue;
    }
    
    if (status) {
      // Ensure status is a valid enum
      if (!Object.values(PipelineStatus).includes(status as PipelineStatus)) {
        return NextResponse.json({ 
          error: 'Invalid status value' 
        }, { status: 400 });
      }
      
      updateData.status = status;
    }
    
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

// Helper function: Get relevant stages for a pipeline type
function getPipelineStages(pipelineType: PipelineType): PipelineStage[] {
  // Sales pipeline stages
  if (pipelineType === PipelineType.SALES) {
    return [
      PipelineStage.NEW_LEAD,
      PipelineStage.QUALIFIED, 
      PipelineStage.APPOINTMENT_SCHEDULED,
      PipelineStage.APPOINTMENT_COMPLETE,
      PipelineStage.PROPOSAL,
      PipelineStage.PROPOSAL_SENT,
      PipelineStage.REVISIONS,
      PipelineStage.WON,
      PipelineStage.LOST
    ];
  }
  
  // Design pipeline stages
  if (pipelineType === PipelineType.DESIGN) {
    return [
      PipelineStage.NEW_DESIGN,
      PipelineStage.DESIGN_STARTED,
      PipelineStage.DESIGN_VERIFICATION,
      PipelineStage.DESIGN_COMPLETE
    ];
  }
  
  // Integration pipeline stages
  if (pipelineType === PipelineType.INTEGRATION) {
    return [
      PipelineStage.APPROVED,
      PipelineStage.DEPOSIT_INVOICE_SENT,
      PipelineStage.DEPOSIT_INVOICE_PAID,
      PipelineStage.EQUIPMENT_ORDERED,
      PipelineStage.EQUIPMENT_RECEIVED,
      PipelineStage.SCHEDULED,
      PipelineStage.INSTALLATION,
      PipelineStage.COMMISSIONING,
      PipelineStage.INVOICE,
      PipelineStage.INTEGRATION_COMPLETE
    ];
  }
  
  // Service pipeline stages
  if (pipelineType === PipelineType.SERVICE) {
    return [
      PipelineStage.SERVICE_REQUEST,
      PipelineStage.SERVICE_SCHEDULED,
      PipelineStage.SERVICE_IN_PROGRESS,
      PipelineStage.SERVICE_COMPLETE
    ];
  }
  
  // Rental pipeline stages
  if (pipelineType === PipelineType.RENTAL) {
    return [
      PipelineStage.RENTAL_REQUEST,
      PipelineStage.RENTAL_QUOTE_SENT,
      PipelineStage.RENTAL_ACCEPTED,
      PipelineStage.RENTAL_SCHEDULED,
      PipelineStage.RENTAL_OUT,
      PipelineStage.RENTAL_RETURNED,
      PipelineStage.RENTAL_INVOICED,
      PipelineStage.RENTAL_COMPLETE
    ];
  }
  
  return [];
}

// Helper function: Convert display name to enum
function findStageEnumFromDisplayName(displayName: string, pipelineType: PipelineType): PipelineStage {
  // Convert display name to a format close to enum (uppercase with underscores)
  const enumFormat = displayName.toUpperCase().replace(/\s+/g, '_');
  
  // Find the matching enum value
  const enumValue = Object.entries(PipelineStage).find(([key, value]) => {
    // Match directly if the format matches
    if (key === enumFormat) return true;
    
    // For pipeline-specific stages, match by content
    if (pipelineType === PipelineType.SALES && key.includes('LEAD') && enumFormat.includes('LEAD')) return true;
    if (pipelineType === PipelineType.DESIGN && key.includes('DESIGN') && enumFormat.includes('DESIGN')) return true;
    if (pipelineType === PipelineType.INTEGRATION && key.includes('INVOICE') && enumFormat.includes('INVOICE')) return true;
    
    return false;
  });
  
  // Return the matched enum or a default
  return enumValue ? enumValue[1] as PipelineStage : getDefaultStage(pipelineType);
}

// Helper function: Get default stage for each pipeline type
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
    case PipelineType.REPAIR:
      return PipelineStage.REPAIR_REQUEST;
    case PipelineType.RENTAL:
      return PipelineStage.RENTAL_REQUEST;
    default:
      return PipelineStage.NEW_LEAD;
  }
}

// Helper function: Create type-specific details record
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

// Helper function: Create a default project if needed
async function createDefaultProject() {
  try {
    // Check if there's a default customer
    let defaultCustomer = await prisma.customer.findFirst();
    
    // If no customers exist, create one
    if (!defaultCustomer) {
      defaultCustomer = await prisma.customer.create({
        data: {
          name: 'Default Customer',
          status: 'Active',
        }
      });
    }
    
    // Create a default project
    const project = await prisma.project.create({
      data: {
        customerId: defaultCustomer.id,
        name: 'Default Project',
        projectStatus: 'Active',
      }
    });
    
    return project;
  } catch (error) {
    console.error('Error creating default project:', error);
    throw error;
  }
}