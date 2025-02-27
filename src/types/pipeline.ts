// Types for pipeline stages
export type SalesStage = 
  | 'New Lead'
  | 'Qualified'
  | 'Appointment Scheduled'
  | 'Design'
  | 'Proposal Sent'
  | 'Revisions'
  | 'Revisions Sent'
  | 'Won'
  | 'Closed Lost';

export type IntegrationStage =
  | 'Approved'
  | 'Invoice Sent'
  | 'Paid'
  | 'Equipment Ordered'
  | 'Equipment Received'
  | 'Scheduled'
  | 'Installation'
  | 'Wrap Up'
  | 'Commission'
  | 'Ready To Invoice'
  | 'Invoiced';

export type ServiceStage =
  | 'Request Received'
  | 'Contacted'
  | 'Scheduled'
  | 'Needs Parts Quote'
  | 'Needs System Sales'
  | 'Needs RMA'
  | 'Needs Revisit'
  | 'Ready To Invoice'
  | 'Invoiced';

export type RentalStage =
  | 'Request Received'
  | 'Contacted'
  | 'Quoting'
  | 'Quote Sent'
  | 'Quote Accepted'
  | 'Ready To Invoice'
  | 'Invoiced';

// Pipeline type discriminator
export type PipelineType = 'sales' | 'integration' | 'service' | 'rental';

// Common interfaces
export interface Customer {
  id: string;
  name: string;
  isReturnCustomer: boolean;
  lastInteraction: Date;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
}

export interface Document {
  id: string;
  fileName: string;
  path: string;
  type: 'estimate' | 'co' | 'photo' | 'documentation' | 'programming';
  uploadDate: Date;
  lastModified: Date;
}

// Base card interface with common properties
export interface BaseCard {
  id: string;
  customerId: string;
  projectNumber: string;
  title: string;
  description: string;
  createdAt: Date;
  lastModified: Date;
  dueDate: Date | null;
  lastInteraction: Date;
  automationStatus: {
    emailLogged: boolean;
    alertsSent: boolean;
    documentsGenerated: boolean;
  };
  documents: Document[];
}

// Pipeline-specific card interfaces
export interface SalesCard extends BaseCard {
  type: 'sales';
  stage: SalesStage;
  estimateValue: number;
  appointmentDate?: Date;
  proposalSentDate?: Date;
}

export interface IntegrationCard extends BaseCard {
  type: 'integration';
  stage: IntegrationStage;
  salesCardId: string;  // Reference to original sales card
  equipmentStatus: {
    ordered: boolean;
    received: boolean;
    installedDate?: Date;
  };
  installationDate?: Date;
}

export interface ServiceCard extends BaseCard {
  type: 'service';
  stage: ServiceStage;
  serviceType: 'maintenance' | 'repair' | 'upgrade';
  rmaNumber?: string;
  partsRequired?: string[];
}

export interface RentalCard extends BaseCard {
  type: 'rental';
  stage: RentalStage;
  eventDate?: Date;
  equipmentList: string[];
  quoteValue: number;
}

// Union type for all card types
export type Card = SalesCard | IntegrationCard | ServiceCard | RentalCard;

// Pipeline column interface
export interface PipelineColumn<T extends Card> {
  id: string;
  title: string;
  cards: T[];
}

// Complete pipeline interface
export interface Pipeline<T extends Card> {
  id: string;
  type: PipelineType;
  columns: PipelineColumn<T>[];
}

// Automation triggers interface
export interface AutomationTrigger {
  sourceType: PipelineType;
  sourceStage: string;
  targetType: PipelineType;
  targetStage: string;
  action: 'create' | 'move' | 'update';
}

// Document generation template interface
export interface DocumentTemplate {
  id: string;
  type: 'proposal' | 'invoice' | 'rma' | 'workOrder';
  template: string;
  requiredFields: string[];
}