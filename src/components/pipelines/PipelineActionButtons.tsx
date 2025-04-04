// src/components/pipelines/PipelineActionButtons.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  requestDesign, 
  completeDesign, 
  createIntegration 
} from "@/lib/actions/pipeline";

// Updated interface to include cardStatus
interface PipelineActionButtonsProps {
  cardId: string;
  cardType: string; // 'sales', 'design', etc.
  cardStage: string; // 'New Lead', 'Appointment Complete', etc.
  cardStatus: string; // Added this property
  onActionComplete?: () => void;
}

export function PipelineActionButtons({
  cardId,
  cardType,
  cardStage,
  cardStatus, // Add it to destructuring as well
  onActionComplete
}: PipelineActionButtonsProps) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  // Request Design action (from Sales "Appointment Complete")
  const handleRequestDesign = async () => {
    if (cardType !== 'sales' || cardStage !== 'Appointment Complete') {
      return;
    }

    setIsPending(true);
    try {
      const result = await requestDesign({ salesCardId: cardId });
      
      if (result.success) {
        toast({
          title: "Design Requested",
          description: `Design card created: ${result.designCardId}`,
        });
        onActionComplete?.();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to request design",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting design:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Complete Design action (from Design "Design Verification")
  const handleCompleteDesign = async () => {
    if (cardType !== 'design' || cardStage !== 'Design Verification') {
      return;
    }

    setIsPending(true);
    try {
      const result = await completeDesign({ designCardId: cardId });
      
      if (result.success) {
        toast({
          title: "Design Completed",
          description: `Sales card updated: ${result.salesCardId}`,
        });
        onActionComplete?.();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to complete design",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error completing design:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Create Integration action (from Sales "Won")
  const handleCreateIntegration = async () => {
    if (cardType !== 'sales' || cardStage !== 'Won') {
      return;
    }

    setIsPending(true);
    try {
      const result = await createIntegration({ salesCardId: cardId });
      
      if (result.success) {
        toast({
          title: "Integration Created",
          description: `Integration card created: ${result.integrationCardId}`,
        });
        onActionComplete?.();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create integration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating integration:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  // Conditionally render appropriate action buttons based on card state
  const renderActionButtons = () => {
    // For Sales cards
    if (cardType === 'sales') {
      if (cardStage === 'Appointment Complete') {
        return (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRequestDesign}
            disabled={isPending}
            className="w-full mt-2"
          >
            {isPending ? "Requesting..." : "Request Design"}
          </Button>
        );
      }
      
      if (cardStage === 'Won') {
        return (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCreateIntegration}
            disabled={isPending}
            className="w-full mt-2"
          >
            {isPending ? "Creating..." : "Create Integration"}
          </Button>
        );
      }
      
      // Show status indicator for cards in design phase
      if (cardStatus === 'Waiting Design') {
        return (
          <div className="text-xs font-semibold text-orange-600 mt-2">
            Waiting for Design...
          </div>
        );
      }
    }
    
    // For Design cards
    if (cardType === 'design') {
      if (cardStage === 'Design Verification') {
        return (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCompleteDesign}
            disabled={isPending}
            className="w-full mt-2"
          >
            {isPending ? "Completing..." : "Complete Design"}
          </Button>
        );
      }
    }
    
    // Default: no buttons
    return null;
  };

  return renderActionButtons();
}

export default PipelineActionButtons;