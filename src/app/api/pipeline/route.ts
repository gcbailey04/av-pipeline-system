// app/api/pipeline/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib';
import { PipelineType, Card } from '@/types/pipeline';

// Mock data for development until DB is fully set up
const mockData = {
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

  if (!type) {
    return NextResponse.json({ error: 'Pipeline type is required' }, { status: 400 });
  }

  try {
    console.log('Fetching pipeline for type:', type);
    
    // For development: return mock data instead of hitting the database
    return NextResponse.json(mockData[type] || []);
  } catch (error) {
    console.error('Failed to get pipeline:', error);
    
    // Fallback to mock data on error
    console.log('Falling back to mock data');
    return NextResponse.json(mockData[type] || []);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, ...data } = body;
    console.log('POST request received:', { type, data });

    // For development: add the card to mock data and return success
    if (type && mockData[type]) {
      const targetColumn = mockData[type].find(col => col.id === data.stage) || mockData[type][0];
      if (targetColumn) {
        targetColumn.cards.push(data);
        return NextResponse.json({ id: data.id, ...data });
      }
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

    // For development: simulate moving card in mock data
    if (type && mockData[type]) {
      // Find and remove the card from its current column
      let card: any = null;
      mockData[type].forEach(column => {
        const cardIndex = column.cards.findIndex((c: any) => c.id === cardId);
        if (cardIndex !== -1) {
          card = column.cards.splice(cardIndex, 1)[0];
        }
      });

      // Add it to the new column
      if (card && stage) {
        const targetColumn = mockData[type].find(col => col.id === stage);
        if (targetColumn) {
          card.stage = stage;
          targetColumn.cards.push(card);
          return NextResponse.json({ success: true, id: cardId });
        }
      }
    }

    return NextResponse.json({ success: true, id: cardId });
  } catch (error) {
    console.error('Failed to update card:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}