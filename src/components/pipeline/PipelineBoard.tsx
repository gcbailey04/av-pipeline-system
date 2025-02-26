import React, { useState } from 'react'
import type { Card as CardType, Pipeline } from '../../types/pipeline'
import { PipelineColumn } from './PipelineColumn'
import { CardEditDialog } from './CardEditDialog'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Skeleton } from '../../components/ui/skeleton'

interface PipelineBoardProps<T extends CardType> {
  pipeline: Pipeline<T>
  onCardMove?: (cardId: string, sourceColumnId: string, targetColumnId: string) => void
  onCardClick?: (card: T) => void
  onCardUpdate?: (cardId: string, updatedCard: T) => void
  isLoading?: boolean
  error?: string | null
}

export const PipelineBoard = <T extends CardType>({
  pipeline,
  onCardMove,
  onCardClick,
  onCardUpdate,
  isLoading = false,
  error = null
}: PipelineBoardProps<T>) => {
  const [draggedCard, setDraggedCard] = useState<{
    card: T
    columnId: string
  } | null>(null)

  // Edit dialog state
  const [editCard, setEditCard] = useState<T | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, card: T) => {
    const columnId = pipeline.columns.find(col => 
      col.cards.some(c => c.id === card.id)
    )?.id

    if (columnId) {
      setDraggedCard({ card, columnId })
    }
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()

    if (draggedCard && draggedCard.columnId !== targetColumnId) {
      try {
        setUpdateError(null)
        await onCardMove?.(
          draggedCard.card.id,
          draggedCard.columnId,
          targetColumnId
        )
      } catch (err) {
        setUpdateError('Failed to move card. Please try again.')
        console.error('Error moving card:', err)
      }
    }

    setDraggedCard(null)
  }

  const handleCardEdit = (card: T) => {
    setEditCard(card)
    setIsEditDialogOpen(true)
    setUpdateError(null)
  }

  const handleCardUpdate = async (updatedCard: T) => {
    try {
      setUpdateError(null)
      await onCardUpdate?.(updatedCard.id, updatedCard)
    } catch (err) {
      setUpdateError('Failed to update card. Please try again.')
      console.error('Error updating card:', err)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex gap-4 p-4 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-80 h-full">
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-32 w-full mb-2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      {updateError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}
      
      <div className="h-full flex gap-4 p-4 overflow-x-auto">
        {pipeline.columns.map((column) => (
          <PipelineColumn
            key={column.id}
            column={column}
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
  )
}