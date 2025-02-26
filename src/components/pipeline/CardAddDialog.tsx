// src/components/pipeline/CardAddDialog.tsx

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
  const [formData, setFormData] = useState<Partial<Card>>({
    title: relatedCard?.title || '',
    description: relatedCard?.description || '',
    customerId: relatedCard?.customerId || uuidv4(), // In a real app, you'd select from customers
    projectNumber: generateProjectNumber(pipelineType),
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentTypes, setDocumentTypes] = useState<Document['type'][]>([]);
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      customerId: uuidv4(),
      projectNumber: generateProjectNumber(pipelineType),
    });
    setSelectedFiles([]);
    setDocumentTypes([]);
  };
  
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
          type: 'sales',
          stage: (initialStage as SalesStage) || 'New Lead',
          estimateValue: typeof formData.estimateValue === 'number' 
            ? formData.estimateValue 
            : 0,
        } as SalesCard;
        break;
        
      case 'integration':
        newCard = {
          ...baseCard,
          type: 'integration',
          stage: (initialStage as IntegrationStage) || 'Approved',
          salesCardId: relatedCard?.id || '',
          equipmentStatus: {
            ordered: false,
            received: false,
          },
        } as IntegrationCard;
        break;
        
      case 'service':
        newCard = {
          ...baseCard,
          type: 'service',
          stage: (initialStage as ServiceStage) || 'Request Received',
          serviceType: (formData as Partial<ServiceCard>).serviceType || 'maintenance',
        } as ServiceCard;
        break;
        
      case 'rental':
        newCard = {
          ...baseCard,
          type: 'rental',
          stage: (initialStage as RentalStage) || 'Request Received',
          eventDate: (formData as Partial<RentalCard>).eventDate,
          equipmentList: [],
          quoteValue: 0,
        } as RentalCard;
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
  
  const renderCommonFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Project Title</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter project title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter project description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
          onChange={(e) => setFormData({ 
            ...formData, 
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
              onChange={(e) => setFormData({ 
                ...formData, 
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
              onValueChange={(value) => setFormData({ 
                ...formData, 
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
              onChange={(e) => setFormData({ 
                ...formData, 
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
              onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
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