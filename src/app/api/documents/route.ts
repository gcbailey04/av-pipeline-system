// src/app/api/documents/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fileStorage } from '../../../lib/fileStorage';
import { prisma } from '../../../lib';
import { Document } from '../../../types/pipeline';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectNumber = formData.get('projectNumber') as string;
    const type = formData.get('type') as Document['type'];
    const cardId = formData.get('cardId') as string;
    const cardType = formData.get('cardType') as string;
    
    if (!file || !projectNumber || !type || !cardId || !cardType) {
      return NextResponse.json(
        { error: 'Missing required fields', required: { file: !!file, projectNumber, type, cardId, cardType } },
        { status: 400 }
      );
    }
    
    // Save the file to storage
    const document = await fileStorage.saveFile({
      file,
      projectNumber,
      type,
    });
    
    // Prepare document data for database but DON'T include relationship yet
    const docData = {
      id: document.id,
      fileName: document.fileName,
      path: document.path,
      type: document.type,
      uploadDate: document.uploadDate,
      lastModified: document.lastModified,
    };
    
    // Set the correct relation field based on the card type
    let createdDoc;
    
    switch (cardType) {
      case 'sales':
        createdDoc = await prisma.document.create({
          data: {
            ...docData,
            salesCard: { connect: { id: cardId } }
          }
        });
        break;
        
      case 'service':
        createdDoc = await prisma.document.create({
          data: {
            ...docData,
            serviceCard: { connect: { id: cardId } }
          }
        });
        break;
        
      case 'rental':
        createdDoc = await prisma.document.create({
          data: {
            ...docData,
            rentalCard: { connect: { id: cardId } }
          }
        });
        break;
        
      case 'integration':
        createdDoc = await prisma.document.create({
          data: {
            ...docData,
            integrationCard: { connect: { id: cardId } }
          }
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid card type' },
          { status: 400 }
        );
    }
    
    // Update the lastModified timestamp on the associated card
    switch (cardType) {
      case 'sales':
        await prisma.salesCard.update({
          where: { id: cardId },
          data: { lastModified: new Date() }
        });
        break;
      case 'service':
        await prisma.serviceCard.update({
          where: { id: cardId },
          data: { lastModified: new Date() }
        });
        break;
      case 'rental':
        await prisma.rentalCard.update({
          where: { id: cardId },
          data: { lastModified: new Date() }
        });
        break;
      case 'integration':
        await prisma.integrationCard.update({
          where: { id: cardId },
          data: { lastModified: new Date() }
        });
        break;
    }
    
    return NextResponse.json(createdDoc);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('cardId');
  const cardType = searchParams.get('cardType');
  
  if (!cardId || !cardType) {
    return NextResponse.json(
      { error: 'Card ID and type are required' },
      { status: 400 }
    );
  }
  
  try {
    let documents;
    
    switch (cardType) {
      case 'sales':
        documents = await prisma.document.findMany({
          where: { salesCardId: cardId }
        });
        break;
      case 'service':
        documents = await prisma.document.findMany({
          where: { serviceCardId: cardId }
        });
        break;
      case 'rental':
        documents = await prisma.document.findMany({
          where: { rentalCardId: cardId }
        });
        break;
      case 'integration':
        documents = await prisma.document.findMany({
          where: { integrationCardId: cardId }
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid card type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: 'Document ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Get the document path from the database
    const document = await prisma.document.findUnique({
      where: { id }
    });
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Delete the file from storage
    const deleted = fileStorage.deleteFile(document.path);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }
    
    // Delete the document metadata from the database
    await prisma.document.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}