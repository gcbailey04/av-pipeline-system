// src/app/api/pipeline/cards/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Card, PipelineType } from '../../../../types/pipeline';

export async function POST(request: NextRequest) {
  try {
    const card = await request.json() as Card;
    
    // Create the card in the database
    const createdCard = await prisma.card.create({
      data: {
        id: card.id,
        customerId: card.customerId,
        projectNumber: card.projectNumber,
        title: card.title,
        description: card.description,
        createdAt: card.createdAt,
        lastModified: card.lastModified,
        dueDate: card.dueDate,
        lastInteraction: card.lastInteraction,
        automationStatus: {
          create: {
            emailLogged: card.automationStatus.emailLogged,
            alertsSent: card.automationStatus.alertsSent,
            documentsGenerated: card.automationStatus.documentsGenerated,
          }
        },
        // Type-specific fields
        type: card.type,
        stage: getCardStage(card),
        
        // Handle type-specific fields
        ...(card.type === 'sales' && {
          estimateValue: (card as any).estimateValue,
          appointmentDate: (card as any).appointmentDate,
          proposalSentDate: (card as any).proposalSentDate,
        }),
        
        ...(card.type === 'integration' && {
          salesCardId: (card as any).salesCardId,
          equipmentStatus: {
            create: {
              ordered: (card as any).equipmentStatus.ordered,
              received: (card as any).equipmentStatus.received,
              installedDate: (card as any).equipmentStatus.installedDate,
            }
          },
          installationDate: (card as any).installationDate,
        }),
        
        ...(card.type === 'service' && {
          serviceType: (card as any).serviceType,
          rmaNumber: (card as any).rmaNumber,
          partsRequired: (card as any).partsRequired,
        }),
        
        ...(card.type === 'rental' && {
          eventDate: (card as any).eventDate,
          equipmentList: (card as any).equipmentList,
          quoteValue: (card as any).quoteValue,
        }),
        
        // Add to the appropriate column
        column: {
          connect: {
            id: await getColumnIdByStage(card.type, getCardStage(card)),
          }
        },
      },
      include: {
        documents: true,
        automationStatus: true,
        ...(card.type === 'integration' && {
          equipmentStatus: true,
        }),
      },
    });
    
    return NextResponse.json(createdCard);
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const card = await request.json() as Card;
    
    // Update the card in the database
    const updatedCard = await prisma.card.update({
      where: { id: card.id },
      data: {
        title: card.title,
        description: card.description,
        lastModified: new Date(),
        dueDate: card.dueDate,
        
        // Handle type-specific fields
        ...(card.type === 'sales' && {
          estimateValue: (card as any).estimateValue,
          appointmentDate: (card as any).appointmentDate,
          proposalSentDate: (card as any).proposalSentDate,
        }),
        
        ...(card.type === 'service' && {
          serviceType: (card as any).serviceType,
          rmaNumber: (card as any).rmaNumber,
          partsRequired: (card as any).partsRequired,
        }),
        
        ...(card.type === 'rental' && {
          eventDate: (card as any).eventDate,
          equipmentList: (card as any).equipmentList,
          quoteValue: (card as any).quoteValue,
        }),
        
        ...(card.type === 'integration' && {
          equipmentStatus: {
            update: {
              ordered: (card as any).equipmentStatus.ordered,
              received: (card as any).equipmentStatus.received,
              installedDate: (card as any).equipmentStatus.installedDate,
            }
          },
          installationDate: (card as any).installationDate,
        }),
      },
      include: {
        documents: true,
        automationStatus: true,
        ...(card.type === 'integration' && {
          equipmentStatus: true,
        }),
      },
    });
    
    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: 'Card ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Delete associated documents first
    await prisma.document.deleteMany({
      where: { cardId: id }
    });
    
    // Delete automation status
    await prisma.automationStatus.delete({
      where: { cardId: id }
    });
    
    // Check if it's an integration card and delete equipment status if needed
    const card = await prisma.card.findUnique({
      where: { id },
      select: { type: true }
    });
    
    if (card?.type === 'integration') {
      await prisma.equipmentStatus.delete({
        where: { cardId: id }
      });
    }
    
    // Delete the card
    await prisma.card.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}

// Helper function to get the stage from a card
function getCardStage(card: Card): string {
  switch (card.type) {
    case 'sales':
      return (card as any).stage;
    case 'integration':
      return (card as any).stage;
    case 'service':
      return (card as any).stage;
    case 'rental':
      return (card as any).stage;
    default:
      throw new Error(`Invalid card type: ${card.type}`);
  }
}

// Helper function to get the column ID by stage
async function getColumnIdByStage(pipelineType: PipelineType, stage: string): Promise<string> {
  const pipeline = await prisma.pipeline.findFirst({
    where: { type: pipelineType },
    include: {
      columns: {
        where: { title: stage },
        select: {
          id: true
        }
      }
    }
  });
  
  if (!pipeline || !pipeline.columns.length) {
    throw new Error(`Column not found for stage: ${stage}`);
  }
  
  return pipeline.columns[0].id;
}