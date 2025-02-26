// app/api/pipeline/route.ts

import { NextResponse } from 'next/server';
import { PipelineService } from '../../../lib/db/pipelineService';

const pipelineService = new PipelineService();

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
  const type = searchParams.get('type') as 'sales' | 'integration' | 'service' | 'rental';

  if (!type) {
    return NextResponse.json({ error: 'Pipeline type is required' }, { status: 400 });
  }

  try {
    console.log('Fetching pipeline for type:', type);
    
    // For development: return mock data instead of hitting the database
    // Remove this conditional when database is fully set up
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(mockData[type] || []);
    }
    
    const pipeline = await pipelineService.getPipeline(type);
    return NextResponse.json(pipeline);
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

    // For development: return mock success response
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ id: 'mock-id', ...data });
    }

    let result;
    switch (type) {
      case 'sales':
        result = await pipelineService.createSalesCard(data);
        break;
      case 'integration':
        result = await pipelineService.createIntegrationCard(data);
        break;
      case 'service':
        result = await pipelineService.createServiceCard(data);
        break;
      case 'rental':
        result = await pipelineService.createRentalCard(data);
        break;
      default:
        return NextResponse.json({ error: 'Invalid pipeline type' }, { status: 400 });
    }

    return NextResponse.json(result);
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

    // For development: return mock success response
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ success: true, id: cardId });
    }

    const result = await pipelineService.updateCardStage(type, cardId, stage);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update card:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}