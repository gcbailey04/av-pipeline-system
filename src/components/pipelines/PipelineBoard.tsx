// src/components/pipelines/PipelineBoard.tsx
import React, { useState } from 'react'
import { Card as CardInterface, Pipeline } from '@/types/pipeline'
import { PipelineColumn } from './PipelineColumn'
import { CardEditDialog } from './CardEditDialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AddCardButton } from './AddCardButton'
import { PipelineType, PipelineStage } from '@prisma/client'
import { typeToDisplayName } from '@/lib/column-helpers'

interface PipelineBoardProps {
  pipeline: Pipeline | null;
  pipelineType: PipelineType;
  onCardMove?: (cardId: string, sourceColumnId: string, targetColumnId: string) => void;
  onCardClick?: (card: CardInterface) => void;
  onCardUpdate?: (cardId: string, updatedCard: CardInterface) => void;
  onCardAdd?: (newCard: CardInterface, files: File[]) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  pipeline,
  pipelineType,
  onCardMove,
  onCardClick,
  onCardUpdate,
  onCardAdd,
  isLoading = false,
  error = null
}) => {
  const [draggedCard, setDraggedCard] = useState<{
    card: CardInterface
    columnId: string
  } | null>(null)

  // Edit dialog state
  const [editCard, setEditCard] = useState<CardInterface | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, card: CardInterface) => {
    if (!pipeline) return;
    
    const columnId = pipeline.columns.find(col => 
      col.cards.some(c => c.id === card.id)
    )?.id;

    if (columnId) {
      setDraggedCard({ card, columnId });
    }
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();

    if (draggedCard && draggedCard.columnId !== targetColumnId) {
      try {
        setUpdateError(null);
        await onCardMove?.(
          draggedCard.card.id,
          draggedCard.columnId,
          targetColumnId
        );
      } catch (err) {
        setUpdateError('Failed to move card. Please try again.');
        console.error('Error moving card:', err);
      }
    }

    setDraggedCard(null);
  }

  const handleCardEdit = (card: CardInterface) => {
    setEditCard(card);
    setIsEditDialogOpen(true);
    setUpdateError(null);
  }

  const handleCardUpdate = async (updatedCard: CardInterface) => {
    try {
      setUpdateError(null);
      await onCardUpdate?.(updatedCard.id, updatedCard);
    } catch (err) {
      setUpdateError('Failed to update card. Please try again.');
      console.error('Error updating card:', err);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Pipeline</h2>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex gap-4 p-4 overflow-x-auto h-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-80 h-full">
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-32 w-full mb-2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No data state (when pipeline is null but not loading)
  if (!pipeline) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <h2 className="text-xl mb-4">No pipeline data available</h2>
        {onCardAdd && (
          <AddCardButton 
            pipelineType={pipelineType}
            onCardAdd={onCardAdd}
          />
        )}
      </div>
    );
  }

  // Helper function to get the pipeline title
  const getPipelineTitle = () => {
    return `${typeToDisplayName(pipelineType)} Pipeline`;
  };

  return (
    <>
      {updateError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {getPipelineTitle()}
        </h2>
        {onCardAdd && (
          <AddCardButton 
            pipelineType={pipelineType}
            onCardAdd={onCardAdd}
          />
        )}
      </div>
      
      <div className="h-full flex gap-4 p-4 overflow-x-auto">
        {pipeline.columns.map((column) => (
          <PipelineColumn
            key={column.id}
            id={column.id}
            title={column.title}
            cards={column.cards}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onCardClick={onCardClick}
            onCardEdit={handleCardEdit}
          />
        ))}
      </div>
      
      <CardEditDialog
        card={editCard}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleCardUpdate}
      />
    </>
  );
};