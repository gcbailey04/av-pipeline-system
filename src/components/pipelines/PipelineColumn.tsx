import React from 'react'
import type { Card as CardType, PipelineColumn as ColumnType } from '../../types/pipeline'
import { PipelineCard } from './PipelineCard'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Separator } from '../ui/separator'

interface PipelineColumnProps<T extends CardType> {
  column: ColumnType<T>
  onDragStart?: (e: React.DragEvent, card: T) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, columnId: string) => void
  onCardClick?: (card: T) => void
  onCardEdit?: (card: T) => void
}

export const PipelineColumn = <T extends CardType>({
  column,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  onCardEdit
}: PipelineColumnProps<T>) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    onDragOver?.(e)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDrop?.(e, column.id)
  }

  return (
    <Card 
      className="w-80 h-full flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex justify-between items-center">
          <span>{column.title}</span>
          <span className="text-sm text-muted-foreground">
            {column.cards.length}
          </span>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {column.cards.map((card) => (
            <PipelineCard<T>
              key={card.id}
              card={card}
              onDragStart={onDragStart}
              onClick={onCardClick}
              onEdit={onCardEdit}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}