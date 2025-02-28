// app/api/pipeline/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib';
import { PipelineType } from '../../../types/pipeline';
import { getPipelineStages } from '../../../lib/column-helpers';
import { prismaToCard, cardToPrismaInput } from '../../../lib/card-helpers';

// Create mock data for fallback
const createMockData = (): Record<PipelineType, Array<{id: string; title: string; cards: any[]}>> => {
  return {
    sales: getPipelineStages('sales').map(stage => ({ ...stage, cards: [] })),
    integration: getPipelineStages('integration').map(stage => ({ ...stage, cards: [] })),
    service: getPipelineStages('service').map(stage => ({ ...stage, cards: [] })),
    rental: getPipelineStages('rental').map(stage => ({ ...stage, cards: [] }))
  };
};

// Add sample card
const mockData = createMockData();
mockData.sales[0].cards.push({
  id: '1',
  type: 'sales',
  customerId: 'cust1',
  projectNumber: 'S2502-001',
  title: 'Office Building AV System',
  description: 'Complete AV system for new office building',
  createdAt: new Date('2025-02-20'),
  lastModified: new Date('2025-02-20'),
  dueDate: new Date('2025-03-20'),
  lastInteraction: new Date('2025-02-20'),
  automationStatus: {
    emailLogged: true,
    alertsSent: false,
    documentsGenerated: false
  },
  documents: [],
  stage: 'New Lead',
  estimateValue: 75000,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as PipelineType;

  if (!type || !(['sales', 'integration', 'service', 'rental'] as PipelineType[]).includes(type)) {
    return NextResponse.json({ error: 'Valid pipeline type is required (sales, integration, service, or rental)' }, { status: 400 });
  }

  try {
    console.log('Fetching pipeline for type:', type);
    
    let cards;
    
    // Fetch cards based on pipeline type
    switch (type) {
      case 'sales':
        cards = await prisma.salesCard.findMany({
          include: {
            customer: true,
            documents: true
          }
        });
        break;
      case 'integration':
        cards = await prisma.integrationCard.findMany({
          include: {
            customer: true,
            documents: true,
            salesCard: true
          }
        });
        break;
      case 'service':
        cards = await prisma.serviceCard.findMany({
          include: {
            customer: true,
            documents: true
          }
        });
        break;
      case 'rental':
        cards = await prisma.rentalCard.findMany({
          include: {
            customer: true,
            documents: true
          }
        });
        break;
      default:
        throw new Error(`Invalid pipeline type: ${type}`);
    }
    
    // Map database cards to application cards using helper function
    const mappedCards = cards.map(dbCard => prismaToCard(dbCard, type));
    
    // Group cards by stage
    const stages = getPipelineStages(type);
    const columns = stages.map(stage => {
      const stageCards = mappedCards.filter(card => card.stage === stage.title);
      return {
        id: stage.id,
        title: stage.title,
        cards: stageCards
      };
    });
    
    return NextResponse.json(columns);
  } catch (error) {
    console.error('Failed to get pipeline:', error);
    
    // Proper error handling with type safety
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    // Fallback to mock data on error
    console.log('Falling back to mock data:', errorMessage);
    return NextResponse.json(mockData[type]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, ...data } = body;
    console.log('POST request received:', { type, data });

    // Type guard to ensure type is a valid PipelineType
    if (!type || !(['sales', 'integration', 'service', 'rental'] as PipelineType[]).includes(type as PipelineType)) {
      return NextResponse.json({ error: 'Valid pipeline type is required' }, { status: 400 });
    }
    
    const validType = type as PipelineType;
    
    // Check for existing customer, or create a new one if needed
    let customer = null;
    if (data.customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      });
      
      if (!customer) {
        // Create a default customer if the ID doesn't exist
        customer = await prisma.customer.create({
          data: {
            id: data.customerId,
            name: 'New Customer',
            email: 'customer@example.com',
            phone: '555-555-5555',
            address: 'No address provided',
            lastInteraction: new Date(),
          }
        });
      }
    }

    // Convert card to Prisma format
    const fullCard = { ...data, type: validType };
    const prismaData = cardToPrismaInput(fullCard);

    // Create card based on type
    let createdCard;
    
    switch (validType) {
      case 'sales':
        createdCard = await prisma.salesCard.create({
          data: prismaData,
          include: {
            documents: true,
            customer: true
          }
        });
        break;
        
      case 'integration':
        createdCard = await prisma.integrationCard.create({
          data: prismaData,
          include: {
            documents: true,
            customer: true,
            salesCard: true
          }
        });
        break;
        
      case 'service':
        createdCard = await prisma.serviceCard.create({
          data: prismaData,
          include: {
            documents: true,
            customer: true
          }
        });
        break;
        
      case 'rental':
        createdCard = await prisma.rentalCard.create({
          data: prismaData,
          include: {
            documents: true,
            customer: true
          }
        });
        break;
        
      default:
        throw new Error(`Invalid card type: ${validType}`);
    }
    
    // Convert database card back to application model
    const responseCard = prismaToCard(createdCard, validType);

    return NextResponse.json(responseCard);
  } catch (error) {
    console.error('Failed to create card:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to create card', details: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { type, cardId, stage, cardData } = body;
    console.log('PATCH request received:', { type, cardId, stage, cardData });

    // Type guard to ensure type is a valid PipelineType
    if (!type || !(['sales', 'integration', 'service', 'rental'] as PipelineType[]).includes(type as PipelineType)) {
      return NextResponse.json({ error: 'Valid pipeline type is required' }, { status: 400 });
    }
    
    const validType = type as PipelineType;
    
    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Handle stage update (card movement)
    if (stage) {
      let updatedCard;
      
      switch (validType) {
        case 'sales':
          updatedCard = await prisma.salesCard.update({
            where: { id: cardId },
            data: { 
              stage,
              lastModified: new Date(),
              lastInteraction: new Date()
            },
            include: {
              documents: true,
              customer: true
            }
          });
          break;
          
        case 'integration':
          updatedCard = await prisma.integrationCard.update({
            where: { id: cardId },
            data: { 
              stage,
              lastModified: new Date(),
              lastInteraction: new Date()
            },
            include: {
              documents: true,
              customer: true,
              salesCard: true
            }
          });
          break;
          
        case 'service':
          updatedCard = await prisma.serviceCard.update({
            where: { id: cardId },
            data: { 
              stage,
              lastModified: new Date(),
              lastInteraction: new Date()
            },
            include: {
              documents: true,
              customer: true
            }
          });
          break;
          
        case 'rental':
          updatedCard = await prisma.rentalCard.update({
            where: { id: cardId },
            data: { 
              stage,
              lastModified: new Date(),
              lastInteraction: new Date()
            },
            include: {
              documents: true,
              customer: true
            }
          });
          break;
          
        default:
          throw new Error(`Invalid card type: ${validType}`);
      }
      
      // Convert database card back to application model
      const responseCard = prismaToCard(updatedCard, validType);
      
      return NextResponse.json(responseCard);
    }
    
    // Handle full card update
    if (cardData) {
      // Add type to cardData for conversion
      const fullCard = { ...cardData, type: validType };
      const prismaData = cardToPrismaInput(fullCard);
      
      // Remove fields that shouldn't be updated directly
      const { id, customerId, projectNumber, createdAt, ...updateData } = prismaData;
      
      let updatedCard;
      
      switch (validType) {
        case 'sales':
          updatedCard = await prisma.salesCard.update({
            where: { id: cardId },
            data: {
              ...updateData,
              lastModified: new Date()
            },
            include: {
              documents: true,
              customer: true
            }
          });
          break;
          
        case 'integration':
          updatedCard = await prisma.integrationCard.update({
            where: { id: cardId },
            data: {
              ...updateData,
              lastModified: new Date()
            },
            include: {
              documents: true,
              customer: true,
              salesCard: true
            }
          });
          break;
          
        case 'service':
          updatedCard = await prisma.serviceCard.update({
            where: { id: cardId },
            data: {
              ...updateData,
              lastModified: new Date()
            },
            include: {
              documents: true,
              customer: true
            }
          });
          break;
          
        case 'rental':
          updatedCard = await prisma.rentalCard.update({
            where: { id: cardId },
            data: {
              ...updateData,
              lastModified: new Date()
            },
            include: {
              documents: true,
              customer: true
            }
          });
          break;
          
        default:
          throw new Error(`Invalid card type: ${validType}`);
      }
      
      // Convert database card back to application model
      const responseCard = prismaToCard(updatedCard, validType);
      
      return NextResponse.json(responseCard);
    }
    
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update card:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to update card', details: errorMessage }, { status: 500 });
  }
}