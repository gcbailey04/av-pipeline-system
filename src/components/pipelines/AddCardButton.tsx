// src/components/pipelines/AddCardButton.tsx

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, PipelineType } from '../../types/pipeline';
import { CardAddDialog } from './CardAddDialog';

interface AddCardButtonProps {
  pipelineType: PipelineType;
  onCardAdd: (newCard: Card, files: File[]) => Promise<void>;
  initialStage?: string;
}

export const AddCardButton: React.FC<AddCardButtonProps> = ({
  pipelineType,
  onCardAdd,
  initialStage
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = async (newCard: Card, files: File[]) => {
    await onCardAdd(newCard, files);
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <PlusCircle size={16} />
        Add {pipelineType === 'sales' ? 'Lead' : 
             pipelineType === 'service' ? 'Service Request' :
             pipelineType === 'rental' ? 'Rental Request' : 'Project'}
      </Button>

      <CardAddDialog
        pipelineType={pipelineType}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        initialStage={initialStage}
      />
    </>
  );
};

export default AddCardButton;