// src/components/pipelines/PipelineColumn.tsx
import React from 'react'
import { Card as CardInterface } from '@/types/pipeline'
import { PipelineCard } from './PipelineCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PipelineType, PipelineStage } from '@prisma/client'

interface PipelineColumnProps {
  id: string;
  title: string;
  cards: CardInterface[];
  onDragStart?: (e: React.DragEvent, card: CardInterface) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, columnId: string) => void;
  onCardClick?: (card: CardInterface) => void;
  onCardEdit?: (card: CardInterface) => void;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  id,
  title,
  cards,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  onCardEdit
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(e, id);
  };

  return (
    <Card 
      className="w-80 h-full flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex justify-between items-center">
          <span>{title}</span>
          <span className="text-sm text-muted-foreground">
            {cards.length}
          </span>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {cards.map((card) => (
            <PipelineCard
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
  );
};