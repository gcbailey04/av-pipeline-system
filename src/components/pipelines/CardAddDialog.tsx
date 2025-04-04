// src/components/pipelines/CardAddDialog.tsx

import React, { useState } from 'react';
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
import { 
  Card, 
  SalesCard, 
  ServiceCard, 
  RentalCard,
  IntegrationCard,
  SalesStage,
  IntegrationStage,
  ServiceStage,
  RentalStage,
  PipelineType,
  Document
} from '../../types/pipeline';
import { getPipelineStages, getDefaultStage } from '../../lib/column-helpers';
import { PipelineType, PipelineStage } from '@prisma/client';

interface CardAddDialogProps {
  pipelineType: PipelineType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (newCard: Card, files: File[]) => Promise<void>;
  initialStage?: string;
  relatedCard?: Card;  // For creating cards from existing ones
}

const generateProjectNumber = (pipelineType: PipelineType): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  const prefixes: Record<PipelineType, string> = {
    'sales': 'S',
    'integration': 'I',
    'service': 'SV',
    'rental': 'R'
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
  // Use more specific state types based on pipeline type
  const [salesFormData, setSalesFormData] = useState<Partial<SalesCard> | null>(null);
  const [serviceFormData, setServiceFormData] = useState<Partial<ServiceCard> | null>(null);
  const [rentalFormData, setRentalFormData] = useState<Partial<RentalCard> | null>(null);
  const [integrationFormData, setIntegrationFormData] = useState<Partial<IntegrationCard> | null>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentTypes, setDocumentTypes] = useState<Document['type'][]>([]);
  
  // Initialize form data based on pipeline type
  React.useEffect(() => {
    const defaultStage = initialStage || getDefaultStage(pipelineType);
    const baseData = {
      title: relatedCard?.title || '',
      description: relatedCard?.description || '',
      customerId: relatedCard?.customerId || uuidv4(),
      projectNumber: generateProjectNumber(pipelineType),
    };
    
    // Reset all form data
    setSalesFormData(null);
    setServiceFormData(null);
    setRentalFormData(null);
    setIntegrationFormData(null);
    
    // Set the appropriate form data based on pipeline type
    switch(pipelineType) {
      case 'sales':
        setSalesFormData({
          ...baseData,
          type: 'sales',
          stage: defaultStage as SalesStage,
          estimateValue: 0,
        });
        break;
      case 'service':
        setServiceFormData({
          ...baseData,
          type: 'service',
          stage: defaultStage as ServiceStage,
          serviceType: 'maintenance',
        });
        break;
      case 'rental':
        setRentalFormData({
          ...baseData,
          type: 'rental',
          stage: defaultStage as RentalStage,
          equipmentList: [],
          quoteValue: 0,
        });
        break;
      case 'integration':
        setIntegrationFormData({
          ...baseData,
          type: 'integration',
          stage: defaultStage as IntegrationStage,
          salesCardId: relatedCard?.id || '',
          equipmentStatus: {
            ordered: false,
            received: false,
          },
        });
        break;
    }
  }, [pipelineType, initialStage, relatedCard]);
  
  // Get the current form data based on pipeline type
  const getFormData = () => {
    switch(pipelineType) {
      case 'sales': return salesFormData;
      case 'service': return serviceFormData;
      case 'rental': return rentalFormData;
      case 'integration': return integrationFormData;
      default: return null;
    }
  };
  
  // Update the appropriate form data based on pipeline type
  const updateFormData = (updates: any) => {
    switch(pipelineType) {
      case 'sales':
        setSalesFormData(prev => prev ? { ...prev, ...updates } : null);
        break;
      case 'service':
        setServiceFormData(prev => prev ? { ...prev, ...updates } : null);
        break;
      case 'rental':
        setRentalFormData(prev => prev ? { ...prev, ...updates } : null);
        break;
      case 'integration':
        setIntegrationFormData(prev => prev ? { ...prev, ...updates } : null);
        break;
    }
  };
  
  const resetForm = () => {
    // Reset all state
    setSalesFormData(null);
    setServiceFormData(null);
    setRentalFormData(null);
    setIntegrationFormData(null);
    setSelectedFiles([]);
    setDocumentTypes([]);
    
    // Re-initialize based on pipeline type
    const defaultStage = getDefaultStage(pipelineType);
    const baseData = {
      title: '',
      description: '',
      customerId: uuidv4(),
      projectNumber: generateProjectNumber(pipelineType),
    };
    
    switch(pipelineType) {
      case 'sales':
        setSalesFormData({
          ...baseData,
          type: 'sales',
          stage: defaultStage as SalesStage,
          estimateValue: 0,
        });
        break;
      case 'service':
        setServiceFormData({
          ...baseData,
          type: 'service',
          stage: defaultStage as ServiceStage,
          serviceType: 'maintenance',
        });
        break;
      case 'rental':
        setRentalFormData({
          ...baseData,
          type: 'rental',
          stage: defaultStage as RentalStage,
          equipmentList: [],
          quoteValue: 0,
        });
        break;
      case 'integration':
        setIntegrationFormData({
          ...baseData,
          type: 'integration',
          stage: defaultStage as IntegrationStage,
          salesCardId: '',
          equipmentStatus: {
            ordered: false,
            received: false,
          },
        });
        break;
    }
  };
  
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = getFormData();
    if (!formData) return;
    
    const now = new Date();
    const baseCard = {
      id: uuidv4(),
      customerId: formData.customerId || uuidv4(),
      projectNumber: formData.projectNumber || generateProjectNumber(pipelineType),
      title: formData.title || 'Untitled Project',
      description: formData.description || '',
      createdAt: now,
      lastModified: now,
      lastInteraction: now,
      dueDate: formData.dueDate || null,
      automationStatus: {
        emailLogged: false,
        alertsSent: false,
        documentsGenerated: false,
      },
      documents: [],
    };
    
    let newCard: Card;
    
    switch (pipelineType) {
      case 'sales':
        newCard = {
          ...baseCard,
          ...salesFormData,
          type: 'sales',
        } as SalesCard;
        break;
        
      case 'service':
        newCard = {
          ...baseCard,
          ...serviceFormData,
          type: 'service',
        } as ServiceCard;
        break;
        
      case 'rental':
        newCard = {
          ...baseCard,
          ...rentalFormData,
          type: 'rental',
        } as RentalCard;
        break;
        
      case 'integration':
        newCard = {
          ...baseCard,
          ...integrationFormData,
          type: 'integration',
        } as IntegrationCard;
        break;
        
      default:
        throw new Error(`Invalid pipeline type: ${pipelineType}`);
    }
    
    await onSave(newCard, selectedFiles);
    handleClose();
  };
  
  const handleFileSelect = (files: File[], type: Document['type']) => {
    setSelectedFiles(prev => [...prev, ...files]);
    setDocumentTypes(prev => [...prev, ...files.map(() => type)]);
  };
  
  const handleFileRemove = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setDocumentTypes(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleStageChange = (value: string) => {
    switch(pipelineType) {
      case 'sales':
        setSalesFormData(prev => prev ? { ...prev, stage: value as SalesStage } : null);
        break;
      case 'service':
        setServiceFormData(prev => prev ? { ...prev, stage: value as ServiceStage } : null);
        break;
      case 'rental':
        setRentalFormData(prev => prev ? { ...prev, stage: value as RentalStage } : null);
        break;
      case 'integration':
        setIntegrationFormData(prev => prev ? { ...prev, stage: value as IntegrationStage } : null);
        break;
    }
  };
  
  const formData = getFormData();
  if (!formData) return null;
  
  const renderCommonFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Project Title</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => updateFormData({ title: e.target.value })}
          placeholder="Enter project title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Enter project description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stage">Stage</Label>
        <Select
          value={formData.stage as string}
          onValueChange={handleStageChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            {getPipelineStages(pipelineType).map((stage) => (
              <SelectItem key={stage.id} value={stage.title}>
                {stage.title}
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
          value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
          onChange={(e) => updateFormData({
            dueDate: e.target.value ? new Date(e.target.value) : null
          })}
        />
      </div>
    </>
  );
  
  const renderTypeSpecificFields = () => {
    switch (pipelineType) {
      case 'sales':
        return (
          <div className="space-y-2">
            <Label htmlFor="estimateValue">Estimate Value ($)</Label>
            <Input
              id="estimateValue"
              type="number"
              value={(formData as Partial<SalesCard>).estimateValue || ''}
              onChange={(e) => updateFormData({
                estimateValue: e.target.value ? parseFloat(e.target.value) : 0
              })}
              placeholder="0.00"
            />
          </div>
        );

      case 'service':
        return (
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Select
              value={(formData as Partial<ServiceCard>).serviceType}
              onValueChange={(value) => updateFormData({
                serviceType: value as 'maintenance' | 'repair' | 'upgrade'
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="upgrade">Upgrade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'rental':
        return (
          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input
              id="eventDate"
              type="date"
              value={(formData as Partial<RentalCard>).eventDate 
                ? new Date((formData as Partial<RentalCard>).eventDate!).toISOString().split('T')[0] 
                : ''}
              onChange={(e) => updateFormData({
                eventDate: e.target.value ? new Date(e.target.value) : undefined
              })}
            />
          </div>
        );

      default:
        return null;
    }
  };
  
  const getDialogTitle = () => {
    const titles: Record<PipelineType, string> = {
      'sales': 'Add Sales Lead',
      'integration': 'Add Integration Project',
      'service': 'Add Service Request',
      'rental': 'Add Rental Request'
    };
    
    return titles[pipelineType] || 'Add New Card';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectNumber">Project Number</Label>
            <Input
              id="projectNumber"
              value={formData.projectNumber || ''}
              onChange={(e) => updateFormData({ projectNumber: e.target.value })}
              disabled
            />
          </div>
          
          {renderCommonFields()}
          {renderTypeSpecificFields()}
          
          <FileUpload 
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            selectedFiles={selectedFiles}
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