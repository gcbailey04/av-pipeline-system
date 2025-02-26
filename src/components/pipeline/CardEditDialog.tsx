import React from 'react';
import { Card as CardType, SalesCard, ServiceCard, RentalCard } from '../../types/pipeline';
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
  const [formData, setFormData] = React.useState<Partial<T> | null>(null);

  React.useEffect(() => {
    if (card) {
      setFormData({ ...card });
    }
  }, [card]);

  if (!card || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData as T);
      onOpenChange(false);
    }
  };

  const renderCommonFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={formatDateForInput(formData.dueDate)}
          onChange={(e) => setFormData({ 
            ...formData, 
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
              onChange={(e) => setFormData({ 
                ...formData, 
                estimateValue: parseFloat(e.target.value) 
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
              value={formatDateForInput((formData as Partial<RentalCard>).eventDate)}
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