// src/lib/column-helpers.ts

import type { SalesStage, ServiceStage, RentalStage, IntegrationStage } from '../types/pipeline';

/**
 * Converts a stage name (like "New Lead") to an ID format (like "new-lead")
 */
export function stageNameToId(stageName: string): string {
  return stageName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Converts an ID (like "new-lead") to a stage name format (like "New Lead")
 */
export function idToStageName(id: string): string {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get the default stage for each pipeline type
 */
export function getDefaultStage(pipelineType: string): string {
  switch (pipelineType) {
    case 'sales':
      return 'New Lead';
    case 'integration':
      return 'Approved';
    case 'service':
      return 'Request Received';
    case 'rental':
      return 'Request Received';
    default:
      return '';
  }
}

/**
 * Get all stages for a specific pipeline type
 */
export function getPipelineStages(pipelineType: string): { id: string, title: string }[] {
  switch (pipelineType) {
    case 'sales':
      return [
        { id: 'new-lead', title: 'New Lead' },
        { id: 'qualified', title: 'Qualified' },
        { id: 'appointment-scheduled', title: 'Appointment Scheduled' },
        { id: 'appointment-complete', title: 'Appointment Complete' }, // Added this stage
        { id: 'design', title: 'Design' },
        { id: 'proposal-sent', title: 'Proposal Sent' },
        { id: 'revisions', title: 'Revisions' },
        { id: 'revisions-sent', title: 'Revisions Sent' },
        { id: 'won', title: 'Won' },
        { id: 'closed-lost', title: 'Closed Lost' }
      ];
    case 'integration':
      return [
        { id: 'approved', title: 'Approved' },
        { id: 'invoice-sent', title: 'Invoice Sent' },
        { id: 'paid', title: 'Paid' },
        { id: 'equipment-ordered', title: 'Equipment Ordered' },
        { id: 'equipment-received', title: 'Equipment Received' },
        { id: 'scheduled', title: 'Scheduled' },
        { id: 'installation', title: 'Installation' },
        { id: 'wrap-up', title: 'Wrap Up' },
        { id: 'commission', title: 'Commission' },
        { id: 'ready-to-invoice', title: 'Ready To Invoice' },
        { id: 'invoiced', title: 'Invoiced' }
      ];
    case 'service':
      return [
        { id: 'request-received', title: 'Request Received' },
        { id: 'contacted', title: 'Contacted' },
        { id: 'scheduled', title: 'Scheduled' },
        { id: 'needs-parts-quote', title: 'Needs Parts Quote' },
        { id: 'needs-system-sales', title: 'Needs System Sales' },
        { id: 'needs-rma', title: 'Needs RMA' },
        { id: 'needs-revisit', title: 'Needs Revisit' },
        { id: 'ready-to-invoice', title: 'Ready To Invoice' },
        { id: 'invoiced', title: 'Invoiced' }
      ];
    case 'rental':
      return [
        { id: 'request-received', title: 'Request Received' },
        { id: 'contacted', title: 'Contacted' },
        { id: 'quoting', title: 'Quoting' },
        { id: 'quote-sent', title: 'Quote Sent' },
        { id: 'quote-accepted', title: 'Quote Accepted' },
        { id: 'ready-to-invoice', title: 'Ready To Invoice' },
        { id: 'invoiced', title: 'Invoiced' }
      ];
    default:
      return [];
  }
}