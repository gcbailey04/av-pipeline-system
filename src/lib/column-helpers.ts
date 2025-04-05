// src/lib/column-helpers.ts

import { PipelineType, PipelineStage, PipelineStatus } from '@prisma/client';

/**
 * Converts a stage enum (like PipelineStage.NEW_LEAD) to an ID format (like "new-lead")
 */
export function stageToId(stage: PipelineStage): string {
  return stage.toString().toLowerCase().replace(/_/g, '-');
}

/**
 * Converts a stage enum to a display name format (like "New Lead")
 */
export function stageToDisplayName(stage: PipelineStage): string {
  return stage
    .toString()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Converts a pipeline type enum to a display name
 */
export function typeToDisplayName(type: PipelineType): string {
  return type
    .toString()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get the default stage for each pipeline type
 */
export function getDefaultStage(pipelineType: PipelineType): PipelineStage {
  switch (pipelineType) {
    case PipelineType.SALES:
      return PipelineStage.NEW_LEAD;
    case PipelineType.DESIGN:
      return PipelineStage.NEW_DESIGN;
    case PipelineType.INTEGRATION:
      return PipelineStage.APPROVED;
    case PipelineType.SERVICE:
      return PipelineStage.SERVICE_REQUEST;
    case PipelineType.REPAIR:
      return PipelineStage.REPAIR_REQUEST;
    case PipelineType.RENTAL:
      return PipelineStage.RENTAL_REQUEST;
    default:
      return PipelineStage.NEW_LEAD;
  }
}

/**
 * Get all stages for a specific pipeline type
 */
export function getPipelineStages(pipelineType: PipelineType): { id: string, title: string, stage: PipelineStage }[] {
  switch (pipelineType) {
    case PipelineType.SALES:
      return [
        { id: stageToId(PipelineStage.NEW_LEAD), title: stageToDisplayName(PipelineStage.NEW_LEAD), stage: PipelineStage.NEW_LEAD },
        { id: stageToId(PipelineStage.QUALIFIED), title: stageToDisplayName(PipelineStage.QUALIFIED), stage: PipelineStage.QUALIFIED },
        { id: stageToId(PipelineStage.APPOINTMENT_SCHEDULED), title: stageToDisplayName(PipelineStage.APPOINTMENT_SCHEDULED), stage: PipelineStage.APPOINTMENT_SCHEDULED },
        { id: stageToId(PipelineStage.APPOINTMENT_COMPLETE), title: stageToDisplayName(PipelineStage.APPOINTMENT_COMPLETE), stage: PipelineStage.APPOINTMENT_COMPLETE },
        { id: stageToId(PipelineStage.PROPOSAL), title: stageToDisplayName(PipelineStage.PROPOSAL), stage: PipelineStage.PROPOSAL },
        { id: stageToId(PipelineStage.PROPOSAL_SENT), title: stageToDisplayName(PipelineStage.PROPOSAL_SENT), stage: PipelineStage.PROPOSAL_SENT },
        { id: stageToId(PipelineStage.REVISIONS), title: stageToDisplayName(PipelineStage.REVISIONS), stage: PipelineStage.REVISIONS },
        { id: stageToId(PipelineStage.WON), title: stageToDisplayName(PipelineStage.WON), stage: PipelineStage.WON },
        { id: stageToId(PipelineStage.LOST), title: stageToDisplayName(PipelineStage.LOST), stage: PipelineStage.LOST }
      ];
    case PipelineType.DESIGN:
      return [
        { id: stageToId(PipelineStage.NEW_DESIGN), title: stageToDisplayName(PipelineStage.NEW_DESIGN), stage: PipelineStage.NEW_DESIGN },
        { id: stageToId(PipelineStage.DESIGN_STARTED), title: stageToDisplayName(PipelineStage.DESIGN_STARTED), stage: PipelineStage.DESIGN_STARTED },
        { id: stageToId(PipelineStage.DESIGN_VERIFICATION), title: stageToDisplayName(PipelineStage.DESIGN_VERIFICATION), stage: PipelineStage.DESIGN_VERIFICATION },
        { id: stageToId(PipelineStage.DESIGN_COMPLETE), title: stageToDisplayName(PipelineStage.DESIGN_COMPLETE), stage: PipelineStage.DESIGN_COMPLETE }
      ];
    case PipelineType.INTEGRATION:
      return [
        { id: stageToId(PipelineStage.APPROVED), title: stageToDisplayName(PipelineStage.APPROVED), stage: PipelineStage.APPROVED },
        { id: stageToId(PipelineStage.DEPOSIT_INVOICE_SENT), title: stageToDisplayName(PipelineStage.DEPOSIT_INVOICE_SENT), stage: PipelineStage.DEPOSIT_INVOICE_SENT },
        { id: stageToId(PipelineStage.DEPOSIT_INVOICE_PAID), title: stageToDisplayName(PipelineStage.DEPOSIT_INVOICE_PAID), stage: PipelineStage.DEPOSIT_INVOICE_PAID },
        { id: stageToId(PipelineStage.EQUIPMENT_ORDERED), title: stageToDisplayName(PipelineStage.EQUIPMENT_ORDERED), stage: PipelineStage.EQUIPMENT_ORDERED },
        { id: stageToId(PipelineStage.EQUIPMENT_RECEIVED), title: stageToDisplayName(PipelineStage.EQUIPMENT_RECEIVED), stage: PipelineStage.EQUIPMENT_RECEIVED },
        { id: stageToId(PipelineStage.SCHEDULED), title: stageToDisplayName(PipelineStage.SCHEDULED), stage: PipelineStage.SCHEDULED },
        { id: stageToId(PipelineStage.INSTALLATION), title: stageToDisplayName(PipelineStage.INSTALLATION), stage: PipelineStage.INSTALLATION },
        { id: stageToId(PipelineStage.COMMISSIONING), title: stageToDisplayName(PipelineStage.COMMISSIONING), stage: PipelineStage.COMMISSIONING },
        { id: stageToId(PipelineStage.INVOICE), title: stageToDisplayName(PipelineStage.INVOICE), stage: PipelineStage.INVOICE },
        { id: stageToId(PipelineStage.INTEGRATION_COMPLETE), title: stageToDisplayName(PipelineStage.INTEGRATION_COMPLETE), stage: PipelineStage.INTEGRATION_COMPLETE }
      ];
    case PipelineType.SERVICE:
      return [
        { id: stageToId(PipelineStage.SERVICE_REQUEST), title: stageToDisplayName(PipelineStage.SERVICE_REQUEST), stage: PipelineStage.SERVICE_REQUEST },
        { id: stageToId(PipelineStage.SERVICE_SCHEDULED), title: stageToDisplayName(PipelineStage.SERVICE_SCHEDULED), stage: PipelineStage.SERVICE_SCHEDULED },
        { id: stageToId(PipelineStage.SERVICE_IN_PROGRESS), title: stageToDisplayName(PipelineStage.SERVICE_IN_PROGRESS), stage: PipelineStage.SERVICE_IN_PROGRESS },
        { id: stageToId(PipelineStage.SERVICE_COMPLETE), title: stageToDisplayName(PipelineStage.SERVICE_COMPLETE), stage: PipelineStage.SERVICE_COMPLETE }
      ];
    case PipelineType.RENTAL:
      return [
        { id: stageToId(PipelineStage.RENTAL_REQUEST), title: stageToDisplayName(PipelineStage.RENTAL_REQUEST), stage: PipelineStage.RENTAL_REQUEST },
        { id: stageToId(PipelineStage.RENTAL_QUOTE_SENT), title: stageToDisplayName(PipelineStage.RENTAL_QUOTE_SENT), stage: PipelineStage.RENTAL_QUOTE_SENT },
        { id: stageToId(PipelineStage.RENTAL_ACCEPTED), title: stageToDisplayName(PipelineStage.RENTAL_ACCEPTED), stage: PipelineStage.RENTAL_ACCEPTED },
        { id: stageToId(PipelineStage.RENTAL_SCHEDULED), title: stageToDisplayName(PipelineStage.RENTAL_SCHEDULED), stage: PipelineStage.RENTAL_SCHEDULED },
        { id: stageToId(PipelineStage.RENTAL_OUT), title: stageToDisplayName(PipelineStage.RENTAL_OUT), stage: PipelineStage.RENTAL_OUT },
        { id: stageToId(PipelineStage.RENTAL_RETURNED), title: stageToDisplayName(PipelineStage.RENTAL_RETURNED), stage: PipelineStage.RENTAL_RETURNED },
        { id: stageToId(PipelineStage.RENTAL_INVOICED), title: stageToDisplayName(PipelineStage.RENTAL_INVOICED), stage: PipelineStage.RENTAL_INVOICED },
        { id: stageToId(PipelineStage.RENTAL_COMPLETE), title: stageToDisplayName(PipelineStage.RENTAL_COMPLETE), stage: PipelineStage.RENTAL_COMPLETE }
      ];
    case PipelineType.REPAIR:
      return [
        { id: stageToId(PipelineStage.REPAIR_REQUEST), title: stageToDisplayName(PipelineStage.REPAIR_REQUEST), stage: PipelineStage.REPAIR_REQUEST },
        { id: stageToId(PipelineStage.REPAIR_SHIPPED_TO_VENDOR), title: stageToDisplayName(PipelineStage.REPAIR_SHIPPED_TO_VENDOR), stage: PipelineStage.REPAIR_SHIPPED_TO_VENDOR },
        { id: stageToId(PipelineStage.REPAIR_IN_PROGRESS), title: stageToDisplayName(PipelineStage.REPAIR_IN_PROGRESS), stage: PipelineStage.REPAIR_IN_PROGRESS },
        { id: stageToId(PipelineStage.REPAIR_RETURNED), title: stageToDisplayName(PipelineStage.REPAIR_RETURNED), stage: PipelineStage.REPAIR_RETURNED },
        { id: stageToId(PipelineStage.REPAIR_COMPLETE), title: stageToDisplayName(PipelineStage.REPAIR_COMPLETE), stage: PipelineStage.REPAIR_COMPLETE }
      ];
    default:
      return [];
  }
}

/**
 * Get a PipelineStage enum from a display name
 */
export function displayNameToStage(displayName: string, pipelineType: PipelineType): PipelineStage {
  // Get all stages for this pipeline type
  const stages = getPipelineStages(pipelineType);
  
  // Find the stage with matching display name
  const matchedStage = stages.find(s => s.title === displayName);
  if (matchedStage) {
    return matchedStage.stage;
  }
  
  // If no match found, return a default based on pipeline type
  return getDefaultStage(pipelineType);
}

/**
 * Format status for display
 */
export function statusToDisplayName(status: PipelineStatus): string {
  return status
    .toString()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}