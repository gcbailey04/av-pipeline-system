import React from 'react'
import { Clock, AlertCircle, Paperclip, RotateCw, Edit2 } from 'lucide-react'
import type { Card as CardType } from '../../types/pipeline'
import { Badge } from '../ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

interface PipelineCardProps<T extends CardType> {
  card: T
  onDragStart?: (e: React.DragEvent, card: T) => void
  onClick?: (card: T) => void
  onEdit?: (card: T) => void
}

const getStatusColor = (lastInteraction: Date): string => {
  const daysSinceInteraction = Math.floor((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceInteraction >= 3) return 'bg-red-500'
  if (daysSinceInteraction >= 2) return 'bg-yellow-500'
  return 'bg-green-500'
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export const PipelineCard = <T extends CardType>({
  card,
  onDragStart,
  onClick,
  onEdit
}: PipelineCardProps<T>) => {
  const statusColor = getStatusColor(card.lastInteraction)
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click event
    onEdit?.(card)
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
            {card.projectNumber}
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
          {card.title}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2">
          {'estimateValue' in card && (
            <Badge variant="outline">
              ${card.estimateValue.toLocaleString()}
            </Badge>
          )}
          {'serviceType' in card && (
            <Badge variant="outline">
              {card.serviceType}
            </Badge>
          )}
          {'eventDate' in card && card.eventDate && (
            <Badge variant="outline">
              {formatDate(card.eventDate)}
            </Badge>
          )}
          {card.documents.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {card.documents.length}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex justify-between items-center w-full text-sm text-gray-500">
          <span>
            Last updated: {formatDate(card.lastModified)}
          </span>
          <div className="flex gap-2">
            {card.automationStatus.alertsSent && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Automated alerts sent
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {card.automationStatus.emailLogged && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <RotateCw className="h-4 w-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Email communication logged
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}