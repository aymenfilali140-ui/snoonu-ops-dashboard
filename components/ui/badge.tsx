// components/ui/badge.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden",
  {
    variants: {
      variant: {
        // Primary pill: Snoonu red
        default:
          "border-[#D90217] bg-[#D90217] text-white",

        // Secondary: white w/ red border/text
        secondary:
          "border-[#D90217] bg-white text-[#D90217]",

        // Destructive: plain red
        destructive:
          "border-red-600 bg-red-600 text-white",

        // Outline: neutral grey border/text
        outline:
          "border-slate-300 bg-white text-slate-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
