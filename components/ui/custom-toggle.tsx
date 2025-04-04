import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { Ticket } from 'lucide-react'

import { cn } from "@/lib/utils"

const CustomToggle = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-12 w-24 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-gray-200",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className={cn(
      "pointer-events-none block h-11 w-11 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-12 data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-12 rtl:data-[state=unchecked]:translate-x-0",
    )}>
      <Ticket className={cn(
        "h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-colors",
        "data-[state=checked]:text-orange-500 data-[state=unchecked]:text-gray-400"
      )} />
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))
CustomToggle.displayName = SwitchPrimitives.Root.displayName

export { CustomToggle }

