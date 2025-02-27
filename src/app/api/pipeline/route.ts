// app/api/pipeline/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib';
import { PipelineType, Card, SalesCard, ServiceCard, RentalCard, IntegrationCard } from '../../../types/pipeline';

// Mock data for development until DB is fully set up
const mockData: Record<PipelineType, Array<{id: string; title: string; cards: any[]}>> = {
  sales: [
    {
      id: 'new-lead',
      title: 'New Lead',
      cards: []
    },
    {
      id: 'qualified',
      title: 'Qualified',
      cards: []
    },
    {
      id: 'appointment',
      title: 'Appointment Scheduled',
      cards: []
    }
  ],
  integration: [
    {
      id: 'approved',
      title: 'Approved',
      cards: []
    },
    {
      id: 'equipment-ordered',
      title: 'Equipment Ordered',
      cards: []
    }
  ],
  service: [
    {
      id: 'request-received',
      title: 'Request Received',
      cards: []
    },
    {
      id: 'scheduled',
      title: 'Scheduled',
      cards: []
    }
  ],
  rental: [
    {
      id: 'request-received',
      title: 'Request Received',
      cards: []
    },
    {
      id: 'quote-sent',
      title: 'Quote Sent',
      cards: []
    }
  ]
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as PipelineType;

  if (!type || !(['sales', 'integration', 'service', 'rental'] as PipelineType[]).includes(type)) {
    return NextResponse.json({ error: 'Valid pipeline type is required (sales, integration, service, or rental)' }, { status: 400 });
  }

  try {
    console.log('Fetching pipeline for type:', type);
    
    // For development: return mock data instead of hitting the database
    return NextResponse.json(mockData[type]);
  } catch (error) {
    console.error('Failed to get pipeline:', error);
    
    // Fallback to mock data on error
    console.log('Falling back to mock data');
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

    // For development: add the card to mock data and return success
    const targetColumn = mockData[validType].find(col => col.id === data.stage) || mockData[validType][0];
    if (targetColumn) {
      targetColumn.cards.push(data);
      return NextResponse.json({ id: data.id, ...data });
    }

    return NextResponse.json({ id: 'mock-id', ...data });
  } catch (error) {
    console.error('Failed to create card:', error);
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { type, cardId, stage } = body;
    console.log('PATCH request received:', { type, cardId, stage });

    // Type guard to ensure type is a valid PipelineType
    if (!type || !(['sales', 'integration', 'service', 'rental'] as PipelineType[]).includes(type as PipelineType)) {
      return NextResponse.json({ error: 'Valid pipeline type is required' }, { status: 400 });
    }
    
    const validType = type as PipelineType;

    // For development: simulate moving card in mock data
    // Find and remove the card from its current column
    let card: any = null;
    mockData[validType].forEach(column => {
      const cardIndex = column.cards.findIndex((c: any) => c.id === cardId);
      if (cardIndex !== -1) {
        card = column.cards.splice(cardIndex, 1)[0];
      }
    });

    // Add it to the new column
    if (card && stage) {
      const targetColumn = mockData[validType].find(col => col.id === stage);
      if (targetColumn) {
        card.stage = stage;
        targetColumn.cards.push(card);
        return NextResponse.json({ success: true, id: cardId });
      }
    }

    return NextResponse.json({ success: true, id: cardId });
  } catch (error) {
    console.error('Failed to update card:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}