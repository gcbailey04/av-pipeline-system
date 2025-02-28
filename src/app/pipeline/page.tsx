'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { PipelineBoard } from '../../components/pipeline/PipelineBoard'
import { useToast } from '../../components/ui/use-toast'
import type { 
  Pipeline, 
  SalesCard, 
  ServiceCard, 
  RentalCard, 
  IntegrationCard,
  PipelineType,
  SalesStage,
  ServiceStage,
  RentalStage,
  IntegrationStage,
  PipelineColumn,
  Card
} from '../../types/pipeline'

type CardTypes = SalesCard | ServiceCard | RentalCard | IntegrationCard;

// Type guard functions to check card types
const isSalesCard = (card: CardTypes): card is SalesCard => card.type === 'sales'
const isServiceCard = (card: CardTypes): card is ServiceCard => card.type === 'service'
const isRentalCard = (card: CardTypes): card is RentalCard => card.type === 'rental'
const isIntegrationCard = (card: CardTypes): card is IntegrationCard => card.type === 'integration'

// Helper function to convert string stage to typed stage
const convertToTypedStage = (type: PipelineType, stageString: string): SalesStage | ServiceStage | RentalStage | IntegrationStage => {
  switch (type) {
    case 'sales':
      return stageString as SalesStage;
    case 'service':
      return stageString as ServiceStage;
    case 'rental':
      return stageString as RentalStage;
    case 'integration':
      return stageString as IntegrationStage;
    default:
      return stageString as any;
  }
};

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState<PipelineType>('sales')
  const [pipeline, setPipeline] = useState<Pipeline<CardTypes> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPipelineData(activeTab)
  }, [activeTab])

  const fetchPipelineData = async (type: PipelineType) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/pipeline?type=${type}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch pipeline data')
      }
      
      const columns = await response.json()
      
      // Create a Pipeline object from the columns
      const typedPipeline: Pipeline<CardTypes> = {
        id: `${type}-pipeline`,
        type,
        columns: columns.map((column: any): PipelineColumn<CardTypes> => ({
          id: column.id,
          title: column.title,
          cards: column.cards.map((card: any) => {
            // Make sure automationStatus is properly structured
            const automationStatus = card.automationStatus || {
              emailLogged: card.emailLogged || false,
              alertsSent: card.alertsSent || false,
              documentsGenerated: card.documentsGenerated || false
            };
            
            // Convert stage string to proper typed stage
            const typedStage = convertToTypedStage(type, card.stage);
            
            // Base card with common properties
            const baseCard = {
              ...card,
              stage: typedStage,
              automationStatus,
              // Ensure dates are Date objects
              createdAt: new Date(card.createdAt),
              lastModified: new Date(card.lastModified),
              lastInteraction: new Date(card.lastInteraction),
              dueDate: card.dueDate ? new Date(card.dueDate) : null,
            };
            
            // Add type-specific properties
            switch (type) {
              case 'sales':
                return {
                  ...baseCard,
                  type: 'sales' as const,
                  appointmentDate: card.appointmentDate ? new Date(card.appointmentDate) : undefined,
                  proposalSentDate: card.proposalSentDate ? new Date(card.proposalSentDate) : undefined,
                  estimateValue: card.estimateValue || 0
                } as SalesCard;
                
              case 'service':
                return {
                  ...baseCard,
                  type: 'service' as const,
                  serviceType: card.serviceType || 'maintenance',
                  rmaNumber: card.rmaNumber,
                  partsRequired: card.partsRequired || []
                } as ServiceCard;
                
              case 'rental':
                return {
                  ...baseCard,
                  type: 'rental' as const,
                  eventDate: card.eventDate ? new Date(card.eventDate) : undefined,
                  equipmentList: card.equipmentList || [],
                  quoteValue: card.quoteValue || 0
                } as RentalCard;
                
              case 'integration':
                return {
                  ...baseCard,
                  type: 'integration' as const,
                  salesCardId: card.salesCardId || '',
                  installationDate: card.installationDate ? new Date(card.installationDate) : undefined,
                  equipmentStatus: {
                    ordered: card.equipmentOrdered || false,
                    received: card.equipmentReceived || false,
                    installedDate: card.installedDate ? new Date(card.installedDate) : undefined
                  }
                } as IntegrationCard;
                
              default:
                return baseCard as any;
            }
          })
        }))
      }
      
      setPipeline(typedPipeline)
    } catch (err) {
      console.error('Failed to fetch pipeline:', err)
      setError(err instanceof Error ? err.message : 'Failed to load pipeline data')
    } finally {
      setLoading(false)
    }
  }

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
      
      // Find the target column title (not the ID)
      const targetColumn = pipeline.columns.find(col => col.id === targetColumnId);
      if (!targetColumn) throw new Error("Target column not found");
      
      // First update UI (optimistic update)
      setPipeline((currentPipeline): Pipeline<CardTypes> | null => {
        if (!currentPipeline) return null;
        
        const updatedColumns: PipelineColumn<CardTypes>[] = currentPipeline.columns.map(column => {
          if (column.id === sourceColumnId) {
            return {
              ...column,
              cards: column.cards.filter(card => card.id !== cardId)
            };
          }
          
          if (column.id === targetColumnId) {
            // Create updated card based on detected type
            let updatedCard: CardTypes;
            
            // The type-safe approach: check specific properties to determine card type
            if ('estimateValue' in cardToMove) {
              // This is a SalesCard
              updatedCard = {
                ...cardToMove,
                stage: convertToTypedStage('sales', targetColumn.title) as SalesStage,
                lastModified: new Date()
              } as SalesCard;
            } else if ('serviceType' in cardToMove) {
              // This is a ServiceCard
              updatedCard = {
                ...cardToMove,
                stage: convertToTypedStage('service', targetColumn.title) as ServiceStage,
                lastModified: new Date()
              } as ServiceCard;
            } else if ('quoteValue' in cardToMove) {
              // This is a RentalCard
              updatedCard = {
                ...cardToMove,
                stage: convertToTypedStage('rental', targetColumn.title) as RentalStage,
                lastModified: new Date()
              } as RentalCard;
            } else {
              // This is an IntegrationCard
              updatedCard = {
                ...cardToMove,
                stage: convertToTypedStage('integration', targetColumn.title) as IntegrationStage,
                lastModified: new Date()
              } as IntegrationCard;
            }
            
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
          type: activeTab,
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
  }
  
  const handleCardUpdate = async (cardId: string, updatedCard: CardTypes) => {
    if (!pipeline) return;
    
    try {
      // First update UI (optimistic update)
      setPipeline((currentPipeline): Pipeline<CardTypes> | null => {
        if (!currentPipeline) return null;
        
        const updatedColumns: PipelineColumn<CardTypes>[] = currentPipeline.columns.map(column => {
          // Create a new array of cards with the updated card
          const updatedCards = column.cards.map(card => {
            if (card.id === cardId) {
              // Make sure updatedCard is treated as the correct type
              const cardWithUpdatedTime = {
                ...updatedCard,
                lastModified: new Date()
              };
              return cardWithUpdatedTime;
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
      const response = await fetch('/api/pipeline/cards', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCard),
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
  }

  const handleCardAdd = async (newCard: CardTypes, files: File[]) => {
    try {
      // Send card to API
      const response = await fetch('/api/pipeline/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCard),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create card');
      }
      
      // Get the created card with its assigned ID from the server
      const createdCard = await response.json();
      
      // Upload files if any
      if (files.length > 0) {
        await Promise.all(files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectNumber', createdCard.projectNumber);
          formData.append('type', 'documentation');
          formData.append('cardId', createdCard.id);
          formData.append('cardType', createdCard.type);
          
          const fileResponse = await fetch('/api/documents', {
            method: 'POST',
            body: formData,
          });
          
          if (!fileResponse.ok) {
            console.error('Failed to upload file', file.name);
            throw new Error(`Failed to upload file ${file.name}`);
          }
        }));
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

  const handleCardClick = (card: CardTypes) => {
    console.log('Card clicked:', card);
    // You could open a detailed view or expanded information panel here
  }

  return (
    <div className="h-screen p-4 bg-gray-100">
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as PipelineType)}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="sales">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="integration">Integration Pipeline</TabsTrigger>
          <TabsTrigger value="service">Service Pipeline</TabsTrigger>
          <TabsTrigger value="rental">Rental Pipeline</TabsTrigger>
        </TabsList>

        <div className="h-[calc(100vh-12rem)]">
          <TabsContent value={activeTab} forceMount>
            <PipelineBoard
              pipeline={pipeline}
              pipelineType={activeTab}
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
  )
}