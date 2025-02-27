// src/app/api/pipeline/cards/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib';
import { Card, PipelineType, SalesCard, ServiceCard, RentalCard, IntegrationCard } from '../../../../types/pipeline';

export async function POST(request: NextRequest) {
  try {
    const cardData = await request.json();
    const card = cardData as Card;
    let createdCard;
    
    // Validate card type
    if (!card) {
      return NextResponse.json(
        { error: 'Invalid card data' },
        { status: 400 }
      );
    }
    
    // Explicitly check for valid type
    const cardType = card.type;
    if (!cardType || !['sales', 'service', 'rental', 'integration'].includes(cardType)) {
      return NextResponse.json(
        { error: 'Invalid card type' },
        { status: 400 }
      );
    }
    
    switch (cardType) {
      case 'sales':
        createdCard = await prisma.salesCard.create({
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
            stage: card.stage,
            emailLogged: (card as SalesCard).automationStatus?.emailLogged || false,
            alertsSent: (card as SalesCard).automationStatus?.alertsSent || false,
            documentsGenerated: (card as SalesCard).automationStatus?.documentsGenerated || false,
            estimateValue: (card as SalesCard).estimateValue || 0,
            appointmentDate: (card as SalesCard).appointmentDate,
            proposalSentDate: (card as SalesCard).proposalSentDate,
          },
          include: {
            documents: true,
          }
        });
        break;
        
      case 'service':
        createdCard = await prisma.serviceCard.create({
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
            stage: card.stage,
            emailLogged: (card as ServiceCard).automationStatus?.emailLogged || false,
            alertsSent: (card as ServiceCard).automationStatus?.alertsSent || false,
            documentsGenerated: (card as ServiceCard).automationStatus?.documentsGenerated || false,
            serviceType: (card as ServiceCard).serviceType || 'maintenance',
            rmaNumber: (card as ServiceCard).rmaNumber,
            partsRequired: (card as ServiceCard).partsRequired || [],
          },
          include: {
            documents: true,
          }
        });
        break;
        
      case 'rental':
        createdCard = await prisma.rentalCard.create({
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
            stage: card.stage,
            emailLogged: (card as RentalCard).automationStatus?.emailLogged || false,
            alertsSent: (card as RentalCard).automationStatus?.alertsSent || false,
            documentsGenerated: (card as RentalCard).automationStatus?.documentsGenerated || false,
            eventDate: (card as RentalCard).eventDate,
            equipmentList: (card as RentalCard).equipmentList || [],
            quoteValue: (card as RentalCard).quoteValue || 0,
          },
          include: {
            documents: true,
          }
        });
        break;
        
      case 'integration':
        createdCard = await prisma.integrationCard.create({
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
            stage: card.stage,
            emailLogged: (card as IntegrationCard).automationStatus?.emailLogged || false,
            alertsSent: (card as IntegrationCard).automationStatus?.alertsSent || false,
            documentsGenerated: (card as IntegrationCard).automationStatus?.documentsGenerated || false,
            salesCardId: (card as IntegrationCard).salesCardId || '',
            equipmentOrdered: (card as IntegrationCard).equipmentStatus?.ordered || false,
            equipmentReceived: (card as IntegrationCard).equipmentStatus?.received || false,
            installedDate: (card as IntegrationCard).equipmentStatus?.installedDate,
            installationDate: (card as IntegrationCard).installationDate,
          },
          include: {
            documents: true,
          }
        });
        break;
        
      default:
        throw new Error(`Invalid card type: ${cardType}`);
    }
    
    return NextResponse.json(createdCard);
  } catch (error: any) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { error: 'Failed to create card', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cardData = await request.json();
    // Explicitly cast the data to Card type to avoid TypeScript errors
    const card = cardData as Card;
    let updatedCard;
    
    // Validate card data
    if (!card || !card.id) {
      return NextResponse.json(
        { error: 'Invalid card data' },
        { status: 400 }
      );
    }
    
    // Fix: Extract type into a separate variable
    const cardType = card.type;
    if (!cardType || !['sales', 'service', 'rental', 'integration'].includes(cardType)) {
      return NextResponse.json(
        { error: 'Invalid card type' },
        { status: 400 }
      );
    }
    
    switch (cardType) {
      case 'sales':
        updatedCard = await prisma.salesCard.update({
          where: { id: card.id },
          data: {
            title: card.title,
            description: card.description,
            lastModified: new Date(),
            dueDate: card.dueDate,
            estimateValue: (card as SalesCard).estimateValue,
            appointmentDate: (card as SalesCard).appointmentDate,
            proposalSentDate: (card as SalesCard).proposalSentDate,
          },
          include: {
            documents: true,
          }
        });
        break;
        
      case 'service':
        updatedCard = await prisma.serviceCard.update({
          where: { id: card.id },
          data: {
            title: card.title,
            description: card.description,
            lastModified: new Date(),
            dueDate: card.dueDate,
            serviceType: (card as ServiceCard).serviceType,
            rmaNumber: (card as ServiceCard).rmaNumber,
            partsRequired: (card as ServiceCard).partsRequired,
          },
          include: {
            documents: true,
          }
        });
        break;
        
      case 'rental':
        updatedCard = await prisma.rentalCard.update({
          where: { id: card.id },
          data: {
            title: card.title,
            description: card.description,
            lastModified: new Date(),
            dueDate: card.dueDate,
            eventDate: (card as RentalCard).eventDate,
            equipmentList: (card as RentalCard).equipmentList,
            quoteValue: (card as RentalCard).quoteValue,
          },
          include: {
            documents: true,
          }
        });
        break;
        
      case 'integration':
        updatedCard = await prisma.integrationCard.update({
          where: { id: card.id },
          data: {
            title: card.title,
            description: card.description,
            lastModified: new Date(),
            dueDate: card.dueDate,
            equipmentOrdered: (card as IntegrationCard).equipmentStatus?.ordered,
            equipmentReceived: (card as IntegrationCard).equipmentStatus?.received,
            installedDate: (card as IntegrationCard).equipmentStatus?.installedDate,
            installationDate: (card as IntegrationCard).installationDate,
          },
          include: {
            documents: true,
          }
        });
        break;
        
      default:
        throw new Error(`Invalid card type: ${cardType}`);
    }
    
    return NextResponse.json(updatedCard);
  } catch (error: any) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { error: 'Failed to update card', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  
  if (!id || !type) {
    return NextResponse.json(
      { error: 'Card ID and type are required' },
      { status: 400 }
    );
  }
  
  // Validate the card type to avoid TypeScript errors
  const validCardType = type as string;
  if (!['sales', 'service', 'rental', 'integration'].includes(validCardType)) {
    return NextResponse.json(
      { error: 'Invalid card type' },
      { status: 400 }
    );
  }
  
  try {
    // Delete associated documents first based on card type
    switch (validCardType) {
      case 'sales':
        await prisma.document.deleteMany({
          where: { salesCardId: id }
        });
        await prisma.salesCard.delete({
          where: { id }
        });
        break;
        
      case 'service':
        await prisma.document.deleteMany({
          where: { serviceCardId: id }
        });
        await prisma.serviceCard.delete({
          where: { id }
        });
        break;
        
      case 'rental':
        await prisma.document.deleteMany({
          where: { rentalCardId: id }
        });
        await prisma.rentalCard.delete({
          where: { id }
        });
        break;
        
      case 'integration':
        await prisma.document.deleteMany({
          where: { integrationCardId: id }
        });
        
        // For the integration card, we need to handle equipment status separately
        // Note: We're removing this code since equipmentStatus is not in our PrismaClient
        // If you have an actual table for this, you'd put the code back
        
        await prisma.integrationCard.delete({
          where: { id }
        });
        break;
        
      default:
        throw new Error(`Invalid card type: ${validCardType}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { error: 'Failed to delete card', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to get the stage from a card
function getCardStage(card: Card): string {
  return card.stage;
}

// Helper function to get the column ID by stage
async function getColumnIdByStage(pipelineType: PipelineType, stage: string): Promise<string> {
  try {
    // For testing/development purposes, just return the stage as the column ID
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: returning stage as column ID');
      return stage;
    }
    
    throw new Error(`Column not found for stage: ${stage}`);
  } catch (error: any) {
    console.error('Error in getColumnIdByStage:', error);
    // In development, return a fallback value
    if (process.env.NODE_ENV === 'development') {
      return stage; // Use the stage as the column ID for development
    }
    throw error;
  }
}