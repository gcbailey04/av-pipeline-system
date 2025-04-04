// src/components/pipelines/PipelineCard.tsx
import React from 'react'
import { Clock, AlertCircle, Paperclip, RotateCw, Edit2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PipelineActionButtons } from '@/components/pipelines/PipelineActionButtons'
import { PipelineType, PipelineStage, PipelineStatus } from '@prisma/client'

// This is a temporary interface for the transition period
// Eventually we should use the actual Prisma types
interface CardType {
  id: string;
  type: string;
  stage: string;
  title: string;
  projectNumber?: string;
  description?: string;
  dueDate?: Date | string | null;
  lastModified?: Date | string;
  lastInteraction?: Date | string;
  documents?: any[];
  automationStatus?: {
    emailLogged?: boolean;
    alertsSent?: boolean;
    documentsGenerated?: boolean;
  };
  // Legacy type-specific properties
  estimateValue?: number;
  serviceType?: string;
  eventDate?: Date | string;
}

interface PipelineCardProps {
  card: CardType;
  onDragStart?: (e: React.DragEvent, card: CardType) => void;
  onClick?: (card: CardType) => void;
  onEdit?: (card: CardType) => void;
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

// Helper function to map string-based type to enum-based PipelineType
const mapCardTypeToEnum = (type: string): PipelineType => {
  switch(type.toLowerCase()) {
    case 'sales': return PipelineType.SALES;
    case 'design': return PipelineType.DESIGN;
    case 'integration': return PipelineType.INTEGRATION;
    case 'service': return PipelineType.SERVICE;
    case 'rental': return PipelineType.RENTAL;
    default: return PipelineType.SALES;
  }
}

// Helper function to map string-based stage to enum-based PipelineStage
const mapCardStageToEnum = (type: string, stage: string): PipelineStage => {
  const lowerType = type.toLowerCase();
  const lowerStage = stage.toLowerCase();
  
  if (lowerType === 'sales') {
    if (lowerStage.includes('new lead')) return PipelineStage.NEW_LEAD;
    if (lowerStage.includes('qualified')) return PipelineStage.QUALIFIED;
    if (lowerStage.includes('appointment scheduled')) return PipelineStage.APPOINTMENT_SCHEDULED;
    if (lowerStage.includes('appointment complete')) return PipelineStage.APPOINTMENT_COMPLETE;
    if (lowerStage.includes('design')) return PipelineStage.DESIGN_STARTED;
    if (lowerStage.includes('proposal') && !lowerStage.includes('sent')) return PipelineStage.PROPOSAL;
    if (lowerStage.includes('proposal sent')) return PipelineStage.PROPOSAL_SENT;
    if (lowerStage.includes('revisions') && !lowerStage.includes('sent')) return PipelineStage.REVISIONS;
    if (lowerStage.includes('won')) return PipelineStage.WON;
    if (lowerStage.includes('lost')) return PipelineStage.LOST;
  } 
  else if (lowerType === 'design') {
    if (lowerStage.includes('new design')) return PipelineStage.NEW_DESIGN;
    if (lowerStage.includes('design started')) return PipelineStage.DESIGN_STARTED;
    if (lowerStage.includes('verification')) return PipelineStage.DESIGN_VERIFICATION;
    if (lowerStage.includes('complete')) return PipelineStage.DESIGN_COMPLETE;
  }
  else if (lowerType === 'integration') {
    if (lowerStage.includes('approved')) return PipelineStage.APPROVED;
    if (lowerStage.includes('invoice sent')) return PipelineStage.DEPOSIT_INVOICE_SENT;
    if (lowerStage.includes('paid')) return PipelineStage.DEPOSIT_INVOICE_PAID;
    if (lowerStage.includes('equipment ordered')) return PipelineStage.EQUIPMENT_ORDERED;
    if (lowerStage.includes('equipment received')) return PipelineStage.EQUIPMENT_RECEIVED;
    if (lowerStage.includes('scheduled')) return PipelineStage.SCHEDULED;
    if (lowerStage.includes('installation')) return PipelineStage.INSTALLATION;
    if (lowerStage.includes('commission')) return PipelineStage.COMMISSIONING;
    if (lowerStage.includes('ready to invoice')) return PipelineStage.INVOICE;
    if (lowerStage.includes('invoiced')) return PipelineStage.INTEGRATION_COMPLETE;
  }
  
  // Fallback to a suitable default based on type
  if (lowerType === 'sales') return PipelineStage.NEW_LEAD;
  if (lowerType === 'design') return PipelineStage.NEW_DESIGN;
  if (lowerType === 'integration') return PipelineStage.APPROVED;
  if (lowerType === 'service') return PipelineStage.SERVICE_REQUEST;
  if (lowerType === 'rental') return PipelineStage.RENTAL_REQUEST;
  
  return PipelineStage.NEW_LEAD;
}

// Helper to determine the status enum
const determineCardStatus = (card: CardType): PipelineStatus => {
  // If this is already using the new model with proper status field
  if ('status' in card && typeof card.status === 'string') {
    try {
      return card.status as PipelineStatus;
    } catch (e) {
      // Fall through to inferring logic
    }
  }
  
  // Legacy logic to infer status
  if (card.type.toLowerCase() === 'sales' && 
      card.stage.toLowerCase().includes('design')) {
    return PipelineStatus.WAITING_DESIGN;
  }
  
  if (card.stage.toLowerCase().includes('lost') || 
      card.stage.toLowerCase().includes('complete') || 
      card.stage.toLowerCase().includes('invoiced')) {
    return PipelineStatus.CLOSED;
  }
  
  return PipelineStatus.OPEN;
}

export const PipelineCard: React.FC<PipelineCardProps> = ({
  card,
  onDragStart,
  onClick,
  onEdit
}) => {
  const statusColor = getStatusColor(card.lastInteraction);
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    onEdit?.(card);
  }

  // Map string-based types to enum-based types for the action buttons
  const cardTypeEnum = mapCardTypeToEnum(card.type);
  const cardStageEnum = mapCardStageToEnum(card.type, card.stage as string);
  const cardStatusEnum = determineCardStatus(card);
  
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
            {card.projectNumber || card.title}
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
          {card.description || card.title}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2">
          {'estimateValue' in card && (
            <Badge variant="outline">
              ${(card as any).estimateValue?.toLocaleString() || '0'}
            </Badge>
          )}
          {'serviceType' in card && (
            <Badge variant="outline">
              {(card as any).serviceType || 'N/A'}
            </Badge>
          )}
          {'eventDate' in card && card.eventDate && (
            <Badge variant="outline">
              {formatDate((card as any).eventDate)}
            </Badge>
          )}
          {card.documents && card.documents.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {card.documents.length}
            </Badge>
          )}
        </div>
        
        {/* Add the action buttons */}
        <PipelineActionButtons
          cardId={card.id}
          cardType={cardTypeEnum}
          cardStage={cardStageEnum}
          cardStatus={cardStatusEnum}
          onActionComplete={() => {
            // This callback is optional - you can use it to refresh data if needed
            // For now, we'll rely on the revalidatePath in the server actions
          }}
        />
      </CardContent>

      <CardFooter className="pt-2">
        <div className="flex justify-between items-center w-full text-sm text-gray-500">
          <span>
            Last updated: {formatDate(card.lastModified)}
          </span>
          <div className="flex gap-2">
            {card.automationStatus?.alertsSent && (
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
            {card.automationStatus?.emailLogged && (
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
  );
}