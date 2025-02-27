// src/app/api/pipeline/cards/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib';
import { Card, PipelineType, SalesCard, ServiceCard, RentalCard, IntegrationCard } from '../../../../types/pipeline';

export async function POST(request: NextRequest) {
  try {
    const cardData = await request.json();
    const card = cardData as Card;
    let createdCard;
    
    // Validate card data
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
    
    // Pre-process automation status since it's stored differently in the database
    const { automationStatus, documents: cardDocuments, type, ...processedCard } = card;
    const automationFields = {
      emailLogged: automationStatus?.emailLogged || false,
      alertsSent: automationStatus?.alertsSent || false,
      documentsGenerated: automationStatus?.documentsGenerated || false,
    };
    
    // Check if customer exists, create if it doesn't
    let customer = await prisma.customer.findUnique({
      where: { id: card.customerId }
    });
    
    if (!customer) {
      // Create a new customer
      customer = await prisma.customer.create({
        data: {
          id: card.customerId,
          name: "New Customer",
          email: "customer@example.com",
          phone: "000-000-0000",
          address: "No address provided",
          lastInteraction: new Date(),
        }
      });
    }
    
    switch (cardType) {
      case 'sales': {
        const { estimateValue, appointmentDate, proposalSentDate, ...commonFields } = processedCard;
        createdCard = await prisma.salesCard.create({
          data: {
            ...commonFields,
            ...automationFields,
            estimateValue: estimateValue || 0,
            appointmentDate: appointmentDate,
            proposalSentDate: proposalSentDate,
          },
          include: {
            documents: true,
            customer: true
          }
        });
        break;
      }
        
      case 'service': {
        const { serviceType, rmaNumber, partsRequired, ...commonFields } = processedCard as ServiceCard;
        createdCard = await prisma.serviceCard.create({
          data: {
            ...commonFields,
            ...automationFields,
            serviceType: serviceType || 'maintenance',
            rmaNumber: rmaNumber,
            partsRequired: partsRequired || [],
          },
          include: {
            documents: true,
            customer: true
          }
        });
        break;
      }
        
      case 'rental': {
        const { quoteValue, eventDate, equipmentList, ...commonFields } = processedCard as RentalCard;
        createdCard = await prisma.rentalCard.create({
          data: {
            ...commonFields,
            ...automationFields,
            quoteValue: quoteValue || 0,
            eventDate: eventDate,
            equipmentList: equipmentList || [],
          },
          include: {
            documents: true,
            customer: true
          }
        });
        break;
      }
        
      case 'integration': {
        const { salesCardId, equipmentStatus, installationDate, ...commonFields } = processedCard as IntegrationCard;
        createdCard = await prisma.integrationCard.create({
          data: {
            ...commonFields,
            ...automationFields,
            salesCardId: salesCardId || '',
            equipmentOrdered: equipmentStatus?.ordered || false,
            equipmentReceived: equipmentStatus?.received || false,
            installedDate: equipmentStatus?.installedDate,
            installationDate: installationDate,
          },
          include: {
            documents: true,
            customer: true,
            salesCard: true
          }
        });
        break;
      }
        
      default:
        throw new Error(`Invalid card type: ${cardType}`);
    }
    
    // Transform back to our application model
    const responseCard = {
      ...createdCard,
      type: cardType,
      automationStatus: {
        emailLogged: createdCard.emailLogged,
        alertsSent: createdCard.alertsSent,
        documentsGenerated: createdCard.documentsGenerated
      },
    };
    
    return NextResponse.json(responseCard);
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
    
    // Pre-process automation status since it's stored differently in the database
    const { automationStatus, documents, id, type, customerId, projectNumber, createdAt, ...updateData } = card;
    const automationFields = {
      emailLogged: automationStatus?.emailLogged || false,
      alertsSent: automationStatus?.alertsSent || false,
      documentsGenerated: automationStatus?.documentsGenerated || false,
    };
    
    switch (cardType) {
      case 'sales': {
        const { estimateValue, appointmentDate, proposalSentDate, ...commonFields } = updateData as Partial<SalesCard>;
        updatedCard = await prisma.salesCard.update({
          where: { id: card.id },
          data: {
            ...commonFields,
            ...automationFields,
            ...(estimateValue !== undefined && { estimateValue }),
            ...(appointmentDate !== undefined && { appointmentDate }),
            ...(proposalSentDate !== undefined && { proposalSentDate }),
            lastModified: new Date()
          },
          include: {
            documents: true,
            customer: true
          }
        });
        break;
      }
        
      case 'service': {
        const { serviceType, rmaNumber, partsRequired, ...commonFields } = updateData as Partial<ServiceCard>;
        updatedCard = await prisma.serviceCard.update({
          where: { id: card.id },
          data: {
            ...commonFields,
            ...automationFields,
            ...(serviceType !== undefined && { serviceType }),
            ...(rmaNumber !== undefined && { rmaNumber }),
            ...(partsRequired !== undefined && { partsRequired }),
            lastModified: new Date()
          },
          include: {
            documents: true,
            customer: true
          }
        });
        break;
      }
        
      case 'rental': {
        const { quoteValue, eventDate, equipmentList, ...commonFields } = updateData as Partial<RentalCard>;
        updatedCard = await prisma.rentalCard.update({
          where: { id: card.id },
          data: {
            ...commonFields,
            ...automationFields,
            ...(quoteValue !== undefined && { quoteValue }),
            ...(eventDate !== undefined && { eventDate }),
            ...(equipmentList !== undefined && { equipmentList }),
            lastModified: new Date()
          },
          include: {
            documents: true,
            customer: true
          }
        });
        break;
      }
        
      case 'integration': {
        const { salesCardId, equipmentStatus, installationDate, ...commonFields } = updateData as Partial<IntegrationCard>;
        updatedCard = await prisma.integrationCard.update({
          where: { id: card.id },
          data: {
            ...commonFields,
            ...automationFields,
            ...(salesCardId !== undefined && { salesCardId }),
            ...(equipmentStatus?.ordered !== undefined && { equipmentOrdered: equipmentStatus.ordered }),
            ...(equipmentStatus?.received !== undefined && { equipmentReceived: equipmentStatus.received }),
            ...(equipmentStatus?.installedDate !== undefined && { installedDate: equipmentStatus.installedDate }),
            ...(installationDate !== undefined && { installationDate }),
            lastModified: new Date()
          },
          include: {
            documents: true,
            customer: true,
            salesCard: true
          }
        });
        break;
      }
        
      default:
        throw new Error(`Invalid card type: ${cardType}`);
    }
    
    // Transform back to our application model
    const responseCard = {
      ...updatedCard,
      id: card.id,
      type: cardType,
      customerId: updatedCard.customerId,
      projectNumber: updatedCard.projectNumber,
      automationStatus: {
        emailLogged: updatedCard.emailLogged,
        alertsSent: updatedCard.alertsSent,
        documentsGenerated: updatedCard.documentsGenerated
      },
    };
    
    return NextResponse.json(responseCard);
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