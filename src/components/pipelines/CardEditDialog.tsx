import React from 'react';
import { 
  Card as CardType, 
  SalesCard, 
  ServiceCard, 
  RentalCard,
  IntegrationCard,
  SalesStage,
  ServiceStage,
  RentalStage,
  IntegrationStage
} from '../../types/pipeline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { getPipelineStages } from '../../lib/column-helpers';

interface CardEditDialogProps<T extends CardType> {
  card: T | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedCard: T) => void;
}

const formatDateForInput = (date: Date | null | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

export const CardEditDialog = <T extends CardType>({
  card,
  open,
  onOpenChange,
  onSave,
}: CardEditDialogProps<T>) => {
  // Type-specific form data to maintain type safety
  const [salesFormData, setSalesFormData] = React.useState<Partial<SalesCard> | null>(null);
  const [serviceFormData, setServiceFormData] = React.useState<Partial<ServiceCard> | null>(null);
  const [rentalFormData, setRentalFormData] = React.useState<Partial<RentalCard> | null>(null);
  const [integrationFormData, setIntegrationFormData] = React.useState<Partial<IntegrationCard> | null>(null);

  // Initialize the appropriate form data when card changes
  React.useEffect(() => {
    if (!card) {
      setSalesFormData(null);
      setServiceFormData(null);
      setRentalFormData(null);
      setIntegrationFormData(null);
      return;
    }

    switch (card.type) {
      case 'sales':
        setSalesFormData({ ...card as SalesCard });
        setServiceFormData(null);
        setRentalFormData(null);
        setIntegrationFormData(null);
        break;
      case 'service':
        setSalesFormData(null);
        setServiceFormData({ ...card as ServiceCard });
        setRentalFormData(null);
        setIntegrationFormData(null);
        break;
      case 'rental':
        setSalesFormData(null);
        setServiceFormData(null);
        setRentalFormData({ ...card as RentalCard });
        setIntegrationFormData(null);
        break;
      case 'integration':
        setSalesFormData(null);
        setServiceFormData(null);
        setRentalFormData(null);
        setIntegrationFormData({ ...card as IntegrationCard });
        break;
    }
  }, [card]);

  if (!card) return null;

  // Helper to get the current form data based on card type
  const getFormData = () => {
    switch (card.type) {
      case 'sales': return salesFormData;
      case 'service': return serviceFormData;
      case 'rental': return rentalFormData;
      case 'integration': return integrationFormData;
      default: return null;
    }
  };

  const formData = getFormData();
  if (!formData) return null;

  // Helper to update the appropriate form data
  const updateFormData = (updates: any) => {
    switch (card.type) {
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

  const handleStageChange = (value: string) => {
    switch (card.type) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a merged card with the updated form data
    let updatedCard;
    
    switch (card.type) {
      case 'sales':
        updatedCard = { ...card, ...salesFormData } as T;
        break;
      case 'service':
        updatedCard = { ...card, ...serviceFormData } as T;
        break;
      case 'rental':
        updatedCard = { ...card, ...rentalFormData } as T;
        break;
      case 'integration':
        updatedCard = { ...card, ...integrationFormData } as T;
        break;
      default:
        return;
    }
    
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
          onChange={(e) => updateFormData({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => updateFormData({ description: e.target.value })}
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
            {getPipelineStages(card.type).map((stage) => (
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
          value={formatDateForInput(formData.dueDate)}
          onChange={(e) => updateFormData({ 
            dueDate: e.target.value ? new Date(e.target.value) : null 
          })}
        />
      </div>
    </>
  );

  const renderTypeSpecificFields = () => {
    switch (card.type) {
      case 'sales':
        return (
          <div className="space-y-2">
            <Label htmlFor="estimateValue">Estimate Value</Label>
            <Input
              id="estimateValue"
              type="number"
              value={(formData as Partial<SalesCard>).estimateValue || ''}
              onChange={(e) => updateFormData({ 
                estimateValue: e.target.value ? parseFloat(e.target.value) : 0
              })}
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
              value={formatDateForInput((formData as Partial<RentalCard>).eventDate)}
              onChange={(e) => updateFormData({ 
                eventDate: e.target.value ? new Date(e.target.value) : undefined 
              })}
            />
          </div>
        );

      case 'integration':
        return (
          <div className="space-y-2">
            <Label htmlFor="equipmentStatus">Equipment Status</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(formData as Partial<IntegrationCard>).equipmentStatus?.ordered || false}
                  onChange={(e) => updateFormData({ 
                    equipmentStatus: {
                      ...(formData as Partial<IntegrationCard>).equipmentStatus,
                      ordered: e.target.checked
                    }
                  })}
                />
                <span>Equipment Ordered</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(formData as Partial<IntegrationCard>).equipmentStatus?.received || false}
                  onChange={(e) => updateFormData({ 
                    equipmentStatus: {
                      ...(formData as Partial<IntegrationCard>).equipmentStatus,
                      received: e.target.checked
                    }
                  })}
                />
                <span>Equipment Received</span>
              </label>
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
          <DialogTitle>Edit {card.projectNumber}</DialogTitle>
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