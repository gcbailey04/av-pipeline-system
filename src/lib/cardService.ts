// src/lib/cardService.ts

import { Card, Document } from '../types/pipeline';

/**
 * Create a new card and upload associated documents
 */
export async function createCard(card: Card, files: File[]): Promise<Card> {
  try {
    // First, create the card
    const response = await fetch('/api/pipeline/cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create card');
    }
    
    const createdCard = await response.json();
    
    // Then upload documents if any
    if (files.length > 0) {
      const documents = await Promise.all(
        files.map(async (file, index) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectNumber', card.projectNumber);
          formData.append('type', 'documentation'); // Default type, can be improved
          formData.append('cardId', createdCard.id);
          
          const docResponse = await fetch('/api/documents', {
            method: 'POST',
            body: formData,
          });
          
          if (!docResponse.ok) {
            console.error('Failed to upload document', file.name);
            return null;
          }
          
          return await docResponse.json();
        })
      );
      
      // Filter out any failed uploads
      const successfulDocuments = documents.filter(Boolean) as Document[];
      
      // Update the card with the new documents
      createdCard.documents = successfulDocuments;
    }
    
    return createdCard;
  } catch (error) {
    console.error('Error in createCard:', error);
    throw error;
  }
}

/**
 * Update an existing card
 */
export async function updateCard(card: Card): Promise<Card> {
  try {
    const response = await fetch('/api/pipeline/cards', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update card');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in updateCard:', error);
    throw error;
  }
}

/**
 * Delete a card
 */
export async function deleteCard(cardId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/pipeline/cards?id=${cardId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete card');
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteCard:', error);
    throw error;
  }
}

/**
 * Upload a document for a card
 */
export async function uploadDocument(
  file: File, 
  cardId: string, 
  projectNumber: string, 
  type: Document['type'] = 'documentation'
): Promise<Document> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectNumber', projectNumber);
    formData.append('type', type);
    formData.append('cardId', cardId);
    
    const response = await fetch('/api/documents', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload document');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in uploadDocument:', error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/documents?id=${documentId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete document');
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    throw error;
  }
}