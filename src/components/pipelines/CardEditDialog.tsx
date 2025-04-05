// src/components/pipelines/CardEditDialog.tsx

import React, { useState, useEffect } from 'react';
import { 
  Card as CardInterface, 
  SalesCard,
  DesignCard,
  IntegrationCard,
  ServiceCard,
  RentalCard,
  RepairCard
} from '@/types/pipeline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PipelineType, PipelineStage, PipelineStatus } from '@prisma/client';
import { getPipelineStages, stageToDisplayName } from '@/lib/column-helpers';

interface CardEditDialogProps {
  card: CardInterface | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedCard: CardInterface) => void;
}

const formatDateForInput = (date: Date | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const CardEditDialog: React.FC<CardEditDialogProps> = ({
  card,
  open,
  onOpenChange,
  onSave,
}) => {
  // State for the current form data
  const [formData, setFormData] = useState<CardInterface | null>(null);

  // Initialize form data when card changes
  useEffect(() => {
    if (!card) {
      setFormData(null);
      return;
    }

    // Create a deep copy to avoid direct mutation
    setFormData(JSON.parse(JSON.stringify(card)));
  }, [card]);

  if (!card || !formData) return null;

  const handleStageChange = (value: string) => {
    // Find the stage enum value by title
    const stages = getPipelineStages(card.type);
    const matchedStage = stages.find(s => s.title === value);
    
    if (matchedStage) {
      setFormData(prev => prev ? {
        ...prev,
        stage: matchedStage.stage
      } : null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) return;
    
    // Update the last modified date
    const updatedCard = {
      ...formData,
      updatedAt: new Date()
    };
    
    onSave(updatedCard);
    onOpenChange(false);
  };

  const renderCommonFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => setFormData(prev => prev ? { ...prev, title: e.target.value } : null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => prev ? { ...prev, notes: e.target.value } : null)}
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
            {getPipelineStages(card.type).map((stageInfo) => (
              <SelectItem key={stageInfo.id} value={stageInfo.title}>
                {stageInfo.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: string) => 
            setFormData(prev => prev ? { 
              ...prev, 
              status: value as PipelineStatus 
            } : null)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PipelineStatus.OPEN}>Open</SelectItem>
            <SelectItem value={PipelineStatus.ON_HOLD}>On Hold</SelectItem>
            <SelectItem value={PipelineStatus.WAITING_DESIGN}>Waiting for Design</SelectItem>
            <SelectItem value={PipelineStatus.CLOSED}>Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formatDateForInput(formData.dueDate as Date | null)}
          onChange={(e) => setFormData(prev => prev ? { 
            ...prev, 
            dueDate: e.target.value ? new Date(e.target.value) : null 
          } : null)}
        />
      </div>
    </>
  );

  const renderTypeSpecificFields = () => {
    switch (card.type) {
      case PipelineType.SALES:
        return (
          <div className="space-y-2">
            <Label htmlFor="estimatedValue">Estimated Value</Label>
            <Input
              id="estimatedValue"
              type="number"
              value={(formData as SalesCard).salesDetails?.estimatedValue || 0}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : 0;
                setFormData(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    salesDetails: {
                      ...(prev as SalesCard).salesDetails,
                      estimatedValue: value
                    }
                  };
                });
              }}
            />
          </div>
        );

      case PipelineType.DESIGN:
        return (
          <div className="space-y-2">
            <Label htmlFor="designRequirements">Design Requirements</Label>
            <Textarea
              id="designRequirements"
              value={(formData as DesignCard).designDetails?.designRequirements || ''}
              onChange={(e) => {
                setFormData(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    designDetails: {
                      ...(prev as DesignCard).designDetails,
                      designRequirements: e.target.value
                    }
                  };
                });
              }}
            />
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              value={(formData as DesignCard).designDetails?.estimatedHours || 0}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : 0;
                setFormData(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    designDetails: {
                      ...(prev as DesignCard).designDetails,
                      estimatedHours: value
                    }
                  };
                });
              }}
            />
          </div>
        );

      case PipelineType.INTEGRATION:
        return (
          <div className="space-y-2">
            <Label htmlFor="approvedProposalValue">Approved Proposal Value</Label>
            <Input
              id="approvedProposalValue"
              type="number"
              value={(formData as IntegrationCard).integrationDetails?.approvedProposalValue || 0}
              onChange={(e) => {
                const value = e.target.value ? parseFloat(e.target.value) : 0;
                setFormData(prev => {
                  if (!prev) return null;
                  return {
                    ...prev,
                    integrationDetails: {
                      ...(prev as IntegrationCard).integrationDetails,
                      approvedProposalValue: value
                    }
                  };
                });
              }}
            />
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="siteReadinessChecklist"
                checked={(formData as IntegrationCard).integrationDetails?.siteReadinessChecklistComplete || false}
                onChange={(e) => {
                  setFormData(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      integrationDetails: {
                        ...(prev as IntegrationCard).integrationDetails,
                        siteReadinessChecklistComplete: e.target.checked
                      }
                    };
                  });
                }}
              />
              <Label htmlFor="siteReadinessChecklist">Site Readiness Checklist Complete</Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {formData.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderCommonFields()}
          {renderTypeSpecificFields()}
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CardEditDialog;