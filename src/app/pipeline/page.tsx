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

// Helper function to ensure stage type safety
const updateCardStage = (card: CardTypes, newStage: string): CardTypes => {
  if (isSalesCard(card)) {
    return { ...card, stage: newStage as SalesStage }
  }
  if (isServiceCard(card)) {
    return { ...card, stage: newStage as ServiceStage }
  }
  if (isRentalCard(card)) {
    return { ...card, stage: newStage as RentalStage }
  }
  if (isIntegrationCard(card)) {
    return { ...card, stage: newStage as IntegrationStage }
  }
  return card
}

// Sample data (keeping your existing sample data)
const samplePipeline: Pipeline<CardTypes> = {
  id: 'sales-pipeline',
  type: 'sales',
  columns: [
    {
      id: 'new-lead',
      title: 'New Lead',
      cards: [
        {
          id: '1',
          type: 'sales',
          customerId: 'cust1',
          projectNumber: 'PRJ001',
          title: 'Office Building AV System',
          description: 'Complete AV system for new office building',
          createdAt: new Date('2025-02-20'),
          lastModified: new Date('2025-02-20'),
          dueDate: new Date('2025-03-20'),
          lastInteraction: new Date('2025-02-20'),
          automationStatus: {
            emailLogged: true,
            alertsSent: false,
            documentsGenerated: false
          },
          documents: [],
          stage: 'New Lead' as SalesStage,
          estimateValue: 75000,
        }
      ]
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
  ]
}

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState<PipelineType>('sales')
  const [pipeline, setPipeline] = useState<Pipeline<CardTypes>>(samplePipeline)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPipelineData(activeTab)
  }, [activeTab])

  const fetchPipelineData = async (type: PipelineType) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pipeline?type=${type}`)
      if (!response.ok) throw new Error('Failed to fetch pipeline data')
      
      const data = await response.json()
      const typedPipeline: Pipeline<CardTypes> = {
        id: `${type}-pipeline`,
        type,
        columns: data.map((column: any): PipelineColumn<CardTypes> => ({
          id: column.id,
          title: column.title,
          cards: column.cards.map((card: any) => updateCardStage(card, card.stage))
        }))
      }
      setPipeline(typedPipeline)
    } catch (err) {
      console.error('Failed to fetch pipeline:', err)
      setError('Failed to load pipeline data')
      setPipeline(samplePipeline)
    } finally {
      setLoading(false)
    }
  }

  const handleCardMove = async (cardId: string, sourceColumnId: string, targetColumnId: string) => {
    try {
      setPipeline((currentPipeline): Pipeline<CardTypes> => {
        const updatedColumns: PipelineColumn<CardTypes>[] = currentPipeline.columns.map(column => {
          if (column.id === sourceColumnId) {
            return {
              ...column,
              cards: column.cards.filter(card => card.id !== cardId)
            }
          }
          if (column.id === targetColumnId) {
            const cardToMove = currentPipeline.columns
              .find(col => col.id === sourceColumnId)
              ?.cards.find(card => card.id === cardId)
            
            if (cardToMove) {
              return {
                ...column,
                cards: [...column.cards, updateCardStage(cardToMove, targetColumnId)]
              }
            }
          }
          return column
        })

        return {
          ...currentPipeline,
          columns: updatedColumns
        }
      })

      const response = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activeTab,
          cardId,
          stage: targetColumnId
        }),
      })

      if (!response.ok) throw new Error('Failed to update card stage')
      toast({
        title: "Card moved",
        description: "Card stage updated successfully",
      })
    } catch (err) {
      console.error('Failed to move card:', err)
      setError('Failed to move card')
      await fetchPipelineData(activeTab)
    }
  }

  const handleCardUpdate = async (cardId: string, updatedCard: CardTypes) => {
    try {
      setPipeline((currentPipeline): Pipeline<CardTypes> => {
        const updatedColumns: PipelineColumn<CardTypes>[] = currentPipeline.columns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.id === cardId ? updateCardStage({
              ...updatedCard,
              lastModified: new Date()
            }, updatedCard.stage) : card
          )
        }))
  
        return {
          ...currentPipeline,
          columns: updatedColumns
        }
      })
  
      // Fixed: Restructure the request body to avoid property conflicts
      const { type, ...cardData } = updatedCard
      const response = await fetch('/api/pipeline', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activeTab,
          cardId,
          cardData
        }),
      })
  
      if (!response.ok) throw new Error('Failed to update card')
      toast({
        title: "Card updated",
        description: "Card details updated successfully",
      })
    } catch (err) {
      console.error('Failed to update card:', err)
      setError('Failed to update card')
      await fetchPipelineData(activeTab)
    }
  }

  const handleCardAdd = async (newCard: CardTypes, files: File[]) => {
    try {
      // First column in the pipeline
      const firstColumn = pipeline.columns[0];
      if (!firstColumn) throw new Error('No columns in pipeline');
      
      // Add card to UI immediately for better UX
      setPipeline((currentPipeline): Pipeline<CardTypes> => {
        const updatedColumns: PipelineColumn<CardTypes>[] = currentPipeline.columns.map(column => {
          if (column.id === firstColumn.id) {
            return {
              ...column,
              cards: [...column.cards, newCard]
            }
          }
          return column;
        });

        return {
          ...currentPipeline,
          columns: updatedColumns
        }
      });

      // Send to API
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCard),
      });

      if (!response.ok) throw new Error('Failed to create card');
      
      // Upload files if any
      if (files.length > 0) {
        await Promise.all(files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('projectNumber', newCard.projectNumber);
          formData.append('type', 'documentation');
          formData.append('cardId', newCard.id);
          formData.append('cardType', newCard.type);
          
          const fileResponse = await fetch('/api/documents', {
            method: 'POST',
            body: formData,
          });
          
          if (!fileResponse.ok) {
            console.error('Failed to upload file', file.name);
          }
        }));
      }
      
      toast({
        title: "Card created",
        description: "New card added successfully",
      });
      
      // Refresh pipeline data
      await fetchPipelineData(activeTab);
    } catch (err) {
      console.error('Failed to add card:', err);
      setError('Failed to add card');
      await fetchPipelineData(activeTab);
    }
  };

  const handleCardClick = (card: CardTypes) => {
    console.log('Card clicked:', card)
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