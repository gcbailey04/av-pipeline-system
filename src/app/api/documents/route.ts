// src/app/api/documents/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fileStorage } from '../../../lib/fileStorage';
import { prisma } from '../../../lib/prisma';
import { Document } from '../../../types/pipeline';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectNumber = formData.get('projectNumber') as string;
    const type = formData.get('type') as Document['type'];
    const cardId = formData.get('cardId') as string;
    
    if (!file || !projectNumber || !type || !cardId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Save the file
    const document = await fileStorage.saveFile({
      file,
      projectNumber,
      type,
    });
    
    // Save document metadata to database - use any to bypass potential type issues
    const docData: any = {
      id: document.id,
      fileName: document.fileName,
      path: document.path,
      type: document.type,
      uploadDate: document.uploadDate,
      lastModified: document.lastModified,
    };
    
    // Dynamically set the relation field based on the card type
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { type: true }
    });
    
    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }
    
    // Set the correct relation field
    const relationField = `${card.type}CardId`;
    docData[relationField] = cardId;
    
    // Create the document
    const createdDoc = await prisma.document.create({
      data: docData
    });
    
    return NextResponse.json(createdDoc);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
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
    
    // Delete the file
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
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}