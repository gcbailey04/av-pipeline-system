import React from 'react'
import { Clock, AlertCircle, Paperclip, RotateCw, Edit2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PipelineActionButtons } from '@/components/pipelines/PipelineActionButtons'
import { PipelineStatus } from '@prisma/client'
import { 
  Card as CardInterface, 
  SalesCard, 
  DesignCard, 
  IntegrationCard,
  PipelineType
} from '@/types/pipeline'
import { stageToDisplayName } from '@/lib/column-helpers'

interface PipelineCardProps {
  card: CardInterface;
  onDragStart?: (e: React.DragEvent, card: CardInterface) => void;
  onClick?: (card: CardInterface) => void;
  onEdit?: (card: CardInterface) => void;
}

const getStatusColor = (lastInteraction: Date | string | null | undefined): string => {
  if (!lastInteraction) return 'bg-gray-500'; // Default color if no date
  
  // Convert to Date object if it's a string
  const interactionDate = typeof lastInteraction === 'string' 
    ? new Date(lastInteraction) 
    : lastInteraction instanceof Date 
      ? lastInteraction 
      : null;
  
  if (!interactionDate || isNaN(interactionDate.getTime())) {
    return 'bg-gray-500'; // Invalid date
  }
  
  const daysSinceInteraction = Math.floor((Date.now() - interactionDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceInteraction >= 3) return 'bg-red-500';
  if (daysSinceInteraction >= 2) return 'bg-yellow-500';
  return 'bg-green-500';
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return 'N/A';
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Invalid date format:', date, error);
    return 'Invalid date';
  }
}

// Type guards to narrow card types
const isSalesCard = (card: CardInterface): card is SalesCard => {
  return card.type === PipelineType.SALES;
}

const isDesignCard = (card: CardInterface): card is DesignCard => {
  return card.type === PipelineType.DESIGN;
}

const isIntegrationCard = (card: CardInterface): card is IntegrationCard => {
  return card.type === PipelineType.INTEGRATION;
}

export const PipelineCard: React.FC<PipelineCardProps> = ({
  card,
  onDragStart,
  onClick,
  onEdit
}) => {
  const statusColor = getStatusColor(card.updatedAt);
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    onEdit?.(card);
  }

  return (
    <Card 
      draggable
      onDragStart={(e) => onDragStart?.(e, card)}
      onClick={() => onClick?.(card)}
      className="w-full cursor-pointer hover:shadow-lg transition-shadow"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            {card.title}
          </CardTitle>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleEdit}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Edit2 className="h-4 w-4 text-gray-500" />
            </button>
            {card.dueDate && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Clock className={
                      new Date(card.dueDate) < new Date() 
                        ? 'text-red-500' 
                        : 'text-gray-500'
                    } />
                  </TooltipTrigger>
                  <TooltipContent>
                    Due: {formatDate(card.dueDate)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className={`h-3 w-3 rounded-full ${statusColor}`} />
          </div>
        </div>
        <CardDescription className="line-clamp-2">
          {card.notes || card.title}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2">
          {/* Type-specific detail badges - using type guards for proper narrowing */}
          {isSalesCard(card) && card.salesDetails?.estimatedValue && (
            <Badge variant="outline">
              ${card.salesDetails.estimatedValue.toLocaleString()}
            </Badge>
          )}
          
          {isDesignCard(card) && card.designDetails?.estimatedHours && (
            <Badge variant="outline">
              Est. {card.designDetails.estimatedHours}h
            </Badge>
          )}
          
          {isIntegrationCard(card) && card.integrationDetails?.approvedProposalValue && (
            <Badge variant="outline">
              ${card.integrationDetails.approvedProposalValue.toLocaleString()}
            </Badge>
          )}
          
          {/* Stage badge */}
          <Badge variant="secondary">
            {stageToDisplayName(card.stage)}
          </Badge>
          
          {/* Documents badge */}
          {card.documents && card.documents.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {card.documents.length}
            </Badge>
          )}
        </div>
        
        {/* Action buttons for pipeline transitions */}
        <PipelineActionButtons
          cardId={card.id}
          cardType={card.type}
          cardStage={card.stage}
          cardStatus={card.status}
          onActionComplete={() => {
            // This callback is optional - you can use it to refresh data if needed
          }}
        />
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex justify-between items-center w-full text-sm text-gray-500">
          <span>
            Last updated: {formatDate(card.updatedAt)}
          </span>
          {/* Status indicators */}
          <div className="flex gap-2">
            {card.status === PipelineStatus.WAITING_DESIGN && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Waiting for design completion
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {card.status === PipelineStatus.ON_HOLD && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <RotateCw className="h-4 w-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Project on hold
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}