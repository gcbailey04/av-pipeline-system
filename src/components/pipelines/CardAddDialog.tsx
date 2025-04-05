// src/components/pipelines/CardAddDialog.tsx

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { FileUpload } from '../ui/file-upload';
import { PipelineType, PipelineStage, PipelineStatus } from '@prisma/client';
import { Card as CardInterface } from '@/types/pipeline';
import { getPipelineStages, getDefaultStage, stageToDisplayName } from '@/lib/column-helpers';

interface CardAddDialogProps {
  pipelineType: PipelineType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newCard: CardInterface, files: File[]) => Promise<void>;
  initialStage?: string;
  relatedCard?: CardInterface;  // For creating cards from existing ones
}

// Generate a unique project number based on pipeline type
const generateProjectNumber = (pipelineType: PipelineType): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  const prefixes: Record<PipelineType, string> = {
    [PipelineType.SALES]: 'S',
    [PipelineType.DESIGN]: 'D',
    [PipelineType.INTEGRATION]: 'I',
    [PipelineType.SERVICE]: 'SV',
    [PipelineType.REPAIR]: 'R',
    [PipelineType.RENTAL]: 'RT'
  };
  
  return `${prefixes[pipelineType]}${year}${month}-${random}`;
};

export const CardAddDialog: React.FC<CardAddDialogProps> = ({
  pipelineType,
  open,
  onOpenChange,
  onSave,
  initialStage,
  relatedCard
}) => {
  // State for card data
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    projectId: string;
    stage: PipelineStage;
    dueDate: string;
    // Type-specific fields
    estimatedValue?: number; // Sales
    designRequirements?: string; // Design
    approvedProposalValue?: number; // Integration
    // File upload
    files: File[];
  }>({
    title: '',
    description: '',
    projectId: '',
    stage: getDefaultStage(pipelineType),
    dueDate: '',
    files: []
  });
  
  // Initialize form data based on pipeline type
  useEffect(() => {
    // Get default stage for this pipeline type
    const defaultStage = initialStage 
      ? getPipelineStages(pipelineType).find(s => s.title === initialStage)?.stage || getDefaultStage(pipelineType)
      : getDefaultStage(pipelineType);
    
    const baseData = {
      title: relatedCard?.title || '',
      description: relatedCard?.notes || '',
      projectId: relatedCard?.projectId || uuidv4(),
      stage: defaultStage,
      dueDate: '',
      files: []
    };
    
    // Set the appropriate form data based on pipeline type
    setFormData({
      ...baseData,
      estimatedValue: pipelineType === PipelineType.SALES ? 0 : undefined,
      designRequirements: pipelineType === PipelineType.DESIGN ? '' : undefined,
      approvedProposalValue: pipelineType === PipelineType.INTEGRATION ? 0 : undefined,
    });
  }, [pipelineType, initialStage, relatedCard]);
  
  const resetForm = () => {
    // Re-initialize based on pipeline type
    const defaultStage = getDefaultStage(pipelineType);
    
    setFormData({
      title: '',
      description: '',
      projectId: uuidv4(),
      stage: defaultStage,
      dueDate: '',
      files: [],
      estimatedValue: pipelineType === PipelineType.SALES ? 0 : undefined,
      designRequirements: pipelineType === PipelineType.DESIGN ? '' : undefined,
      approvedProposalValue: pipelineType === PipelineType.INTEGRATION ? 0 : undefined,
    });
  };
  
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    
    // Create base card data
    const baseCard = {
      id: uuidv4(),
      projectId: formData.projectId || uuidv4(),
      type: pipelineType,
      stage: formData.stage,
      status: PipelineStatus.OPEN,
      title: formData.title || 'New Project',
      notes: formData.description || '',
      createdAt: now,
      updatedAt: now,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
    };
    
    // Create card with type-specific details
    let newCard: CardInterface;
    
    switch (pipelineType) {
      case PipelineType.SALES:
        newCard = {
          ...baseCard,
          type: PipelineType.SALES,
          salesDetails: {
            id: uuidv4(),
            cardId: baseCard.id,
            estimatedValue: formData.estimatedValue || 0
          }
        };
        break;
        
      case PipelineType.DESIGN:
        newCard = {
          ...baseCard,
          type: PipelineType.DESIGN,
          designDetails: {
            id: uuidv4(),
            cardId: baseCard.id,
            designRequirements: formData.designRequirements || '',
            estimatedHours: 0
          }
        };
        break;
        
      case PipelineType.INTEGRATION:
        newCard = {
          ...baseCard,
          type: PipelineType.INTEGRATION,
          integrationDetails: {
            id: uuidv4(),
            cardId: baseCard.id,
            approvedProposalValue: formData.approvedProposalValue || 0,
            depositAmount: formData.approvedProposalValue ? formData.approvedProposalValue * 0.5 : 0,
            siteReadinessChecklistComplete: false
          }
        };
        break;
        
      case PipelineType.SERVICE:
      case PipelineType.REPAIR:
      case PipelineType.RENTAL:
      default:
        // Generic card for other types
        newCard = {
          ...baseCard
        };
        break;
    }
    
    // If this card is created from a related card, set the originating card ID
    if (relatedCard) {
      newCard.originating_card_id = relatedCard.id;
    }
    
    await onSave(newCard, formData.files);
    handleClose();
  };
  
  const handleFileSelect = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };
  
  const handleFileRemove = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };
  
  const handleStageChange = (value: string) => {
    // Find the stage enum value by title
    const stages = getPipelineStages(pipelineType);
    const matchedStage = stages.find(s => s.title === value);
    
    if (matchedStage) {
      setFormData(prev => ({
        ...prev,
        stage: matchedStage.stage
      }));
    }
  };
  
  // Helper function to get dialog title based on pipeline type
  const getDialogTitle = () => {
    switch (pipelineType) {
      case PipelineType.SALES:
        return 'Add Sales Lead';
      case PipelineType.DESIGN:
        return 'Add Design Project';
      case PipelineType.INTEGRATION:
        return 'Add Integration Project';
      case PipelineType.SERVICE:
        return 'Add Service Request';
      case PipelineType.REPAIR:
        return 'Add Repair Request';
      case PipelineType.RENTAL:
        return 'Add Rental Request';
      default:
        return 'Add New Project';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter project title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select
              value={stageToDisplayName(formData.stage)}
              onValueChange={handleStageChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {getPipelineStages(pipelineType).map((stageInfo) => (
                  <SelectItem key={stageInfo.id} value={stageInfo.title}>
                    {stageInfo.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          
          {/* Type-specific fields */}
          {pipelineType === PipelineType.SALES && (
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
              <Input
                id="estimatedValue"
                type="number"
                value={formData.estimatedValue || 0}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimatedValue: e.target.value ? parseFloat(e.target.value) : 0 
                }))}
                placeholder="0.00"
              />
            </div>
          )}
          
          {pipelineType === PipelineType.DESIGN && (
            <div className="space-y-2">
              <Label htmlFor="designRequirements">Design Requirements</Label>
              <Textarea
                id="designRequirements"
                value={formData.designRequirements || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  designRequirements: e.target.value 
                }))}
                placeholder="Enter design requirements"
                rows={3}
              />
            </div>
          )}
          
          {pipelineType === PipelineType.INTEGRATION && (
            <div className="space-y-2">
              <Label htmlFor="approvedProposalValue">Approved Proposal Value ($)</Label>
              <Input
                id="approvedProposalValue"
                type="number"
                value={formData.approvedProposalValue || 0}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  approvedProposalValue: e.target.value ? parseFloat(e.target.value) : 0 
                }))}
                placeholder="0.00"
              />
            </div>
          )}
          
          {/* File upload */}
          <FileUpload 
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFiles={formData.files}
          />
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CardAddDialog;