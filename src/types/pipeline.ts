// src/types/pipeline.ts
import { PipelineType as PrismaPipelineType, PipelineStage as PrismaPipelineStage, PipelineStatus as PrismaPipelineStatus } from '@prisma/client';

// Re-export the Prisma types
export type PipelineType = PrismaPipelineType;
export type PipelineStage = PrismaPipelineStage;
export type PipelineStatus = PrismaPipelineStatus;

// Create value objects that match the Prisma enums
export const PipelineType = {
  SALES: 'SALES' as PrismaPipelineType,
  DESIGN: 'DESIGN' as PrismaPipelineType,
  INTEGRATION: 'INTEGRATION' as PrismaPipelineType,
  SERVICE: 'SERVICE' as PrismaPipelineType,
  REPAIR: 'REPAIR' as PrismaPipelineType,
  RENTAL: 'RENTAL' as PrismaPipelineType
} as const;

// Common interfaces
export interface Customer {
  id: string;
  name: string;
  status?: string;
  grading?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  uploadTimestamp: Date;
  description?: string;
  uploaderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  customerId: string;
  locationId?: string;
  name: string;
  description?: string;
  projectStatus?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  location?: Location;
  contacts?: Contact[];
  pipelineCards?: Card[];
  documents?: Document[];
}

export interface Location {
  id: string;
  customerId: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  designation?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  customerId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  role?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Base card interface with common properties
export interface BaseCard {
  id: string;
  projectId: string;
  type: PipelineType;
  stage: PipelineStage;
  status: PipelineStatus;
  title: string;
  assignedUserId?: string;
  notes?: string;
  originating_card_id?: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  documents?: Document[];
  dueDate?: Date | null; // Added dueDate to base card since it appears to be common
}

// Pipeline-specific card interfaces with their specific details
export interface SalesCard extends BaseCard {
  type: typeof PipelineType.SALES;
  salesDetails?: {
    id: string;
    cardId: string;
    estimatedValue?: number;
    estimatedCloseDate?: Date;
    source?: string;
    nextStepSummary?: string;
    lastActivityDate?: Date;
  };
}

export interface DesignCard extends BaseCard {
  type: typeof PipelineType.DESIGN;
  designDetails?: {
    id: string;
    cardId: string;
    designRequirements?: string;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    assignedDesignerId?: string;
  };
}

export interface IntegrationCard extends BaseCard {
  type: typeof PipelineType.INTEGRATION;
  integrationDetails?: {
    id: string;
    cardId: string;
    approvedProposalValue?: number;
    depositAmount?: number;
    installationStartDate?: Date;
    installationEndDate?: Date;
    siteReadinessChecklistComplete: boolean;
    projectManagerId?: string;
    leadTechnicianId?: string;
  };
}

export interface ServiceCard extends BaseCard {
  type: typeof PipelineType.SERVICE;
  // Service-specific details will be added in future phases
}

export interface RepairCard extends BaseCard {
  type: typeof PipelineType.REPAIR;
  // Repair-specific details will be added in future phases
}

export interface RentalCard extends BaseCard {
  type: typeof PipelineType.RENTAL;
  // Rental-specific details will be added in future phases
}

// Union type for all card types
export type Card = SalesCard | DesignCard | IntegrationCard | ServiceCard | RepairCard | RentalCard;

// Pipeline column interface
export interface PipelineColumn<T extends Card = Card> {
  id: string;
  title: string;
  cards: T[];
}

// Complete pipeline interface
export interface Pipeline<T extends Card = Card> {
  id: string;
  type: PipelineType;
  columns: PipelineColumn<T>[];
}

// Helper functions to convert enum values to display text
export function pipelineTypeToDisplayText(type: PipelineType): string {
  switch (type) {
    case PipelineType.SALES: return 'Sales';
    case PipelineType.DESIGN: return 'Design';
    case PipelineType.INTEGRATION: return 'Integration';
    case PipelineType.SERVICE: return 'Service';
    case PipelineType.REPAIR: return 'Repair';
    case PipelineType.RENTAL: return 'Rental';
    default: return String(type);
  }
}

export function pipelineStageToDisplayText(stage: PipelineStage): string {
  // Replace underscores with spaces and convert to Title Case
  return stage.toString()
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}