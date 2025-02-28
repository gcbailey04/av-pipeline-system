// src/app/api/pipeline/cards/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib';
import { Card, PipelineType, SalesCard, ServiceCard, RentalCard, IntegrationCard } from '../../../../types/pipeline';
import { cardToPrismaInput, prismaToCard } from '../../../../lib/card-helpers';

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
    
    // Convert card to Prisma format for the specific type
    const prismaData = cardToPrismaInput(card);
    
    switch (cardType) {
      case 'sales':
        createdCard = await prisma.salesCard.create({
          data: prismaData,
          include: {
            documents: true,
            customer: true
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
        
      default:
        throw new Error(`Invalid card type: ${cardType}`);
    }
    
    // Convert database card back to application model
    const responseCard = prismaToCard(createdCard, cardType as PipelineType);
    
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
    
    // Convert card to Prisma format - we'll destructure id and other fields that shouldn't be updated
    const prismaData = cardToPrismaInput(card);
    const { id, customerId, projectNumber, createdAt, ...updateData } = prismaData;
    
    switch (cardType) {
      case 'sales':
        updatedCard = await prisma.salesCard.update({
          where: { id: card.id },
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
        
      case 'service':
        updatedCard = await prisma.serviceCard.update({
          where: { id: card.id },
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
          where: { id: card.id },
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
          where: { id: card.id },
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
        
      default:
        throw new Error(`Invalid card type: ${cardType}`);
    }
    
    // Convert database card back to application model
    const responseCard = prismaToCard(updatedCard, cardType as PipelineType);
    
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