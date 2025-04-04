import React from 'react'
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function TooltipExample() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">راهنما</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>این یک متن راهنما است</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

