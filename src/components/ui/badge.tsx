import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyber-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-cyber-primary text-white hover:bg-cyber-primary/80",
        secondary:
          "border-transparent bg-cyber-secondary text-white hover:bg-cyber-secondary/80",
        destructive:
          "border-transparent bg-cyber-danger text-white hover:bg-cyber-danger/80",
        outline:
          "border-cyber-border text-cyber-text",
        success:
          "border-transparent bg-cyber-success/15 text-cyber-success border-cyber-success/30",
        warning:
          "border-transparent bg-cyber-warning/15 text-cyber-warning border-cyber-warning/30",
        danger:
          "border-transparent bg-cyber-danger/15 text-cyber-danger border-cyber-danger/30",
        info:
          "border-transparent bg-cyber-accent/15 text-cyber-accent border-cyber-accent/30",
        primary:
          "border-transparent bg-cyber-primary/15 text-cyber-primary border-cyber-primary/30",
        muted:
          "border-transparent bg-cyber-surface text-cyber-text-muted border-cyber-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
