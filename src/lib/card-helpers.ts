// src/lib/card-helpers.ts

import type { 
    Card, 
    SalesCard, 
    ServiceCard, 
    RentalCard, 
    IntegrationCard, 
    PipelineType,
    SalesStage,
    ServiceStage,
    RentalStage,
    IntegrationStage
  } from '../types/pipeline';
  
  /**
   * Converts application Card models to Prisma-compatible input data for each specific card type
   */
  export function cardToPrismaInput(card: Card): any {
    // Extract common fields
    const { 
      type, 
      documents, 
      automationStatus, 
      ...commonFields 
    } = card;
    
    // Add automation fields
    const automationFields = {
      emailLogged: automationStatus?.emailLogged || false,
      alertsSent: automationStatus?.alertsSent || false,
      documentsGenerated: automationStatus?.documentsGenerated || false,
    };
    
    // Type-specific conversion
    switch (type) {
      case 'sales': {
        const salesCard = card as SalesCard;
        const { estimateValue, appointmentDate, proposalSentDate, ...rest } = salesCard;
        
        return {
          ...rest,
          ...automationFields,
          estimateValue: estimateValue || 0,
          appointmentDate: appointmentDate,
          proposalSentDate: proposalSentDate,
        };
      }
      case 'service': {
        const serviceCard = card as ServiceCard;
        const { serviceType, rmaNumber, partsRequired, ...rest } = serviceCard;
        
        return {
          ...rest,
          ...automationFields,
          serviceType: serviceType || 'maintenance',
          rmaNumber: rmaNumber,
          partsRequired: partsRequired || [],
        };
      }
      case 'rental': {
        const rentalCard = card as RentalCard;
        const { quoteValue, eventDate, equipmentList, ...rest } = rentalCard;
        
        return {
          ...rest,
          ...automationFields,
          quoteValue: quoteValue || 0,
          eventDate: eventDate,
          equipmentList: equipmentList || [],
        };
      }
      case 'integration': {
        const integrationCard = card as IntegrationCard;
        const { salesCardId, equipmentStatus, installationDate, ...rest } = integrationCard;
        
        return {
          ...rest,
          ...automationFields,
          salesCardId: salesCardId,
          equipmentOrdered: equipmentStatus?.ordered || false,
          equipmentReceived: equipmentStatus?.received || false,
          installedDate: equipmentStatus?.installedDate,
          installationDate: installationDate,
        };
      }
      default:
        throw new Error(`Invalid card type: ${type}`);
    }
  }
  
  /**
   * Converts Prisma Card data to application Card models
   */
  export function prismaToCard(
    dbCard: any, 
    type: PipelineType
  ): SalesCard | ServiceCard | RentalCard | IntegrationCard {
    // Common fields for all card types
    const baseCard = {
      id: dbCard.id,
      customerId: dbCard.customerId,
      projectNumber: dbCard.projectNumber,
      title: dbCard.title || '',
      description: dbCard.description || '',
      createdAt: new Date(dbCard.createdAt),
      lastModified: new Date(dbCard.lastModified),
      lastInteraction: new Date(dbCard.lastInteraction),
      dueDate: dbCard.dueDate ? new Date(dbCard.dueDate) : null,
      documents: dbCard.documents || [],
      automationStatus: {
        emailLogged: dbCard.emailLogged || false,
        alertsSent: dbCard.alertsSent || false,
        documentsGenerated: dbCard.documentsGenerated || false,
      },
    };
  
    // Convert stage string to the appropriate typed stage
    let typedStage;
    switch (type) {
      case 'sales':
        typedStage = dbCard.stage as SalesStage;
        break;
      case 'service':
        typedStage = dbCard.stage as ServiceStage;
        break;
      case 'rental':
        typedStage = dbCard.stage as RentalStage;
        break;
      case 'integration':
        typedStage = dbCard.stage as IntegrationStage;
        break;
      default:
        typedStage = dbCard.stage;
    }
  
    // Create the appropriate card type
    switch (type) {
      case 'sales':
        return {
          ...baseCard,
          type: 'sales',
          stage: typedStage as SalesStage,
          estimateValue: dbCard.estimateValue || 0,
          appointmentDate: dbCard.appointmentDate ? new Date(dbCard.appointmentDate) : undefined,
          proposalSentDate: dbCard.proposalSentDate ? new Date(dbCard.proposalSentDate) : undefined,
        } as SalesCard;
      
      case 'service':
        return {
          ...baseCard,
          type: 'service',
          stage: typedStage as ServiceStage,
          serviceType: dbCard.serviceType || 'maintenance',
          rmaNumber: dbCard.rmaNumber,
          partsRequired: dbCard.partsRequired || [],
        } as ServiceCard;
      
      case 'rental':
        return {
          ...baseCard,
          type: 'rental',
          stage: typedStage as RentalStage,
          eventDate: dbCard.eventDate ? new Date(dbCard.eventDate) : undefined,
          equipmentList: dbCard.equipmentList || [],
          quoteValue: dbCard.quoteValue || 0,
        } as RentalCard;
      
      case 'integration':
        return {
          ...baseCard,
          type: 'integration',
          stage: typedStage as IntegrationStage,
          salesCardId: dbCard.salesCardId || '',
          installationDate: dbCard.installationDate ? new Date(dbCard.installationDate) : undefined,
          equipmentStatus: {
            ordered: dbCard.equipmentOrdered || false,
            received: dbCard.equipmentReceived || false,
            installedDate: dbCard.installedDate ? new Date(dbCard.installedDate) : undefined,
          },
        } as IntegrationCard;
      
      default:
        throw new Error(`Invalid card type: ${type}`);
    }
  }