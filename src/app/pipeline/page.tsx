// src/app/pipeline/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PipelineBoard } from '@/components/pipelines/PipelineBoard'
import { useToast } from '@/components/ui/use-toast'
import { PipelineType } from '@prisma/client'

interface CardType {
  id: string;
  type: string;
  stage: string;
  status?: string;
  title: string;
  description?: string;
  projectNumber?: string;
  projectId?: string; // Added this property to fix the error
  dueDate?: Date | string | null;
  lastModified?: Date | string;
  lastInteraction?: Date | string;
  documents?: any[];
  // Other properties as needed
}

interface PipelineColumn {
  id: string;
  title: string;
  cards: CardType[];
}

interface Pipeline {
  id: string;
  type: string;
  columns: PipelineColumn[];
}

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState<string>(PipelineType.SALES);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPipelineData(activeTab);
  }, [activeTab]);

  const fetchPipelineData = async (type: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pipeline?type=${type}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch pipeline data');
      }
      
      const columns = await response.json();
      
      // Create a Pipeline object from the columns
      const pipeline: Pipeline = {
        id: `${type}-pipeline`,
        type,
        columns: columns.map((column: any): PipelineColumn => ({
          id: column.id,
          title: column.title,
          cards: column.cards.map((card: any) => ({
            ...card,
            type: card.type || type, // In new model, type is part of the card
            // Ensure dates are Date objects
            createdAt: card.createdAt ? new Date(card.createdAt) : new Date(),
            updatedAt: card.updatedAt ? new Date(card.updatedAt) : new Date(),
            lastModified: card.updatedAt ? new Date(card.updatedAt) : new Date(),
            lastInteraction: card.updatedAt ? new Date(card.updatedAt) : new Date(),
            dueDate: card.dueDate ? new Date(card.dueDate) : null,
          }))
        }))
      };
      
      setPipeline(pipeline);
    } catch (err) {
      console.error('Failed to fetch pipeline:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  const handleCardMove = async (cardId: string, sourceColumnId: string, targetColumnId: string) => {
    if (!pipeline) return;
    
    try {
      // Find the card and its source column
      const sourceColumn = pipeline.columns.find(col => col.id === sourceColumnId);
      if (!sourceColumn) throw new Error("Source column not found");
      
      const cardToMoveIndex = sourceColumn.cards.findIndex(card => card.id === cardId);
      if (cardToMoveIndex === -1) throw new Error("Card not found");
      
      // Get a reference to the card
      const cardToMove = sourceColumn.cards[cardToMoveIndex];
      
      // Find the target column
      const targetColumn = pipeline.columns.find(col => col.id === targetColumnId);
      if (!targetColumn) throw new Error("Target column not found");
      
      // First update UI (optimistic update)
      setPipeline((currentPipeline): Pipeline | null => {
        if (!currentPipeline) return null;
        
        const updatedColumns = currentPipeline.columns.map(column => {
          if (column.id === sourceColumnId) {
            return {
              ...column,
              cards: column.cards.filter(card => card.id !== cardId)
            };
          }
          
          if (column.id === targetColumnId) {
            // Create updated card
            const updatedCard = {
              ...cardToMove,
              stage: targetColumn.title,
              lastModified: new Date()
            };
            
            return {
              ...column,
              cards: [...column.cards, updatedCard]
            };
          }
          
          return column;
        });
  
        return {
          ...currentPipeline,
          columns: updatedColumns
        };
      });
  
      // Then send to API
      const response = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          stage: targetColumn.title
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update card stage');
      }
      
      toast({
        title: "Card moved",
        description: "Card stage updated successfully",
      });
    } catch (err) {
      console.error('Failed to move card:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to move card',
        variant: "destructive"
      });
      
      // Revert the optimistic update by refreshing
      await fetchPipelineData(activeTab);
    }
  };
  
  const handleCardUpdate = async (cardId: string, updatedCard: CardType) => {
    if (!pipeline) return;
    
    try {
      // First update UI (optimistic update)
      setPipeline((currentPipeline): Pipeline | null => {
        if (!currentPipeline) return null;
        
        const updatedColumns = currentPipeline.columns.map(column => {
          // Create a new array of cards with the updated card
          const updatedCards = column.cards.map(card => {
            if (card.id === cardId) {
              return {
                ...updatedCard,
                lastModified: new Date()
              };
            }
            return card;
          });
          
          // Return a new column with the updated cards
          return {
            ...column,
            cards: updatedCards
          };
        });

        // Return a new pipeline with the updated columns
        return {
          ...currentPipeline,
          columns: updatedColumns
        };
      });
  
      // Then send to API
      const response = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          ...updatedCard,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update card');
      }
      
      toast({
        title: "Card updated",
        description: "Card details updated successfully",
      });
    } catch (err) {
      console.error('Failed to update card:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update card',
        variant: "destructive"
      });
      
      // Revert the optimistic update by refreshing
      await fetchPipelineData(activeTab);
    }
  };

  // Helper function to get or create a default project
  async function getOrCreateDefaultProject(pipelineType: string): Promise<string> {
    // For now, return a hardcoded project ID for testing
    // In production, this should query the database for an appropriate project
    // or create one if needed
    return "clmfgyzx40000lf08rb30f6q3"; // Replace with a valid project ID from your database
  }

  const handleCardAdd = async (newCard: CardType, files: File[]) => {
    try {
      // Prepare the card data for the API
      const cardData = {
        type: activeTab,
        title: newCard.title,
        description: newCard.description,
        projectId: newCard.projectId || await getOrCreateDefaultProject(activeTab)
      };

      // Send card to API
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create card');
      }
      
      // Get the created card with its assigned ID from the server
      const createdCard = await response.json();
      
      // Upload files if any - you'll need to update this when you implement document handling
      if (files.length > 0) {
        // Handle file uploads here
        console.log('Files to upload:', files);
      }
      
      toast({
        title: "Card created",
        description: "New card added successfully",
      });
      
      // Refresh pipeline data to include the new card
      await fetchPipelineData(activeTab);
    } catch (err) {
      console.error('Failed to add card:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to add card',
        variant: "destructive"
      });
    }
  };

  const handleCardClick = (card: CardType) => {
    console.log('Card clicked:', card);
    // You could open a detailed view or expanded information panel here
  };

  return (
    <div className="h-screen p-4 bg-gray-100">
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="mb-6">
          <TabsTrigger value={PipelineType.SALES}>Sales Pipeline</TabsTrigger>
          <TabsTrigger value={PipelineType.DESIGN}>Design Pipeline</TabsTrigger>
          <TabsTrigger value={PipelineType.INTEGRATION}>Integration Pipeline</TabsTrigger>
          <TabsTrigger value={PipelineType.SERVICE}>Service Pipeline</TabsTrigger>
          <TabsTrigger value={PipelineType.RENTAL}>Rental Pipeline</TabsTrigger>
        </TabsList>

        <div className="h-[calc(100vh-12rem)]">
          <TabsContent value={activeTab} forceMount>
            <PipelineBoard
              pipeline={pipeline as any} // Use type assertion to bypass the type checking for now
              pipelineType={activeTab as any} // Use type assertion to bypass the type checking for now
              onCardMove={handleCardMove}
              onCardClick={handleCardClick}
              onCardUpdate={handleCardUpdate}
              onCardAdd={handleCardAdd}
              isLoading={loading}
              error={error}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}