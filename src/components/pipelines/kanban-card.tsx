// components/pipelines/kanban-card.tsx
"use client"; // Server actions can be called from client components

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// Assuming you have a type for your card data, adjust as necessary
// Maybe fetch it with details included: import { PipelineCardWithDetails } ...
import { PipelineCard, PipelineType, PipelineStage, PipelineStatus } from "@prisma/client";
import { requestDesign } from "@/lib/actions/pipeline"; // Import the server action
import { toast } from "sonner"; // Or your preferred toast library

// Define props, assuming 'card' contains all necessary fields
interface KanbanCardProps {
  card: PipelineCard; // Adjust type if you include relations/details
  // Add other props like drag handlers etc.
}

export function KanbanCard({ card }: KanbanCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleRequestDesign = () => {
    startTransition(async () => {
      try {
          const result = await requestDesign({ salesCardId: card.id });

          if (result.success) {
            toast.success(`Design requested. New card ID: ${result.designCardId}`);
            // Revalidation triggered by the server action should update the board
          } else {
            toast.error(`Failed to request design: ${result.error || 'Unknown error'}`);
          }
      } catch (error) {
           console.error("Client-side error requesting design:", error);
           toast.error("An unexpected error occurred.");
      }
    });
  };

  // Determine if the "Request Design" button should be shown
  const showRequestDesignButton =
    card.type === PipelineType.SALES &&
    card.stage === PipelineStage.APPOINTMENT_COMPLETE &&
    card.status === PipelineStatus.OPEN;

  return (
    <Card className="mb-2">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
        {/* Add more header info if needed */}
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {/* Display other card info like status, stage, etc. */}
        <p>Status: {card.status}</p>
        <p>Stage: {card.stage}</p>
        {/* ... other details ... */}

        {/* Conditional Request Design Button */}
        {showRequestDesignButton && (
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={handleRequestDesign}
            disabled={isPending}
          >
            {isPending ? "Requesting..." : "Request Design"}
          </Button>
        )}

        {/* Show if waiting for design */}
         {card.status === PipelineStatus.WAITING_DESIGN && card.type === PipelineType.SALES && (
            <p className="mt-2 text-xs font-semibold text-orange-600">
                Waiting for Design...
            </p>
         )}
      </CardContent>
    </Card>
  );
}