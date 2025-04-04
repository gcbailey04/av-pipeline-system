// src/components/pipelines/AddCardButton.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PipelineType } from '@prisma/client';
import { CardAddDialog } from './CardAddDialog';

interface AddCardButtonProps {
  pipelineType: PipelineType;
  onCardAdd: (newCard: any, files: File[]) => Promise<void>;
  initialStage?: string;
}

export const AddCardButton: React.FC<AddCardButtonProps> = ({
  pipelineType,
  onCardAdd,
  initialStage
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = async (newCard: any, files: File[]) => {
    await onCardAdd(newCard, files);
    setIsDialogOpen(false);
  };

  // Helper function to get button text based on pipeline type
  const getButtonText = () => {
    switch (pipelineType) {
      case PipelineType.SALES:
        return 'Add Lead';
      case PipelineType.DESIGN:
        return 'Add Design';
      case PipelineType.SERVICE:
        return 'Add Service Request';
      case PipelineType.RENTAL:
        return 'Add Rental Request';
      case PipelineType.INTEGRATION:
        return 'Add Integration Project';
      default:
        return 'Add Project';
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <PlusCircle size={16} />
        {getButtonText()}
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