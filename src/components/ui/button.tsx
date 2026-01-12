import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-cyber-primary text-white hover:bg-cyber-primary/90 shadow-lg shadow-cyber-primary/25",
        destructive:
          "bg-cyber-danger text-white hover:bg-cyber-danger/90 shadow-lg shadow-cyber-danger/25",
        outline:
          "border border-cyber-border bg-transparent hover:bg-cyber-surface hover:border-cyber-primary text-cyber-text",
        secondary:
          "bg-cyber-secondary text-white hover:bg-cyber-secondary/90 shadow-lg shadow-cyber-secondary/25",
        ghost:
          "hover:bg-cyber-surface text-cyber-text hover:text-cyber-text",
        link:
          "text-cyber-primary underline-offset-4 hover:underline",
        success:
          "bg-cyber-success text-white hover:bg-cyber-success/90 shadow-lg shadow-cyber-success/25",
        accent:
          "bg-cyber-accent text-white hover:bg-cyber-accent/90 shadow-lg shadow-cyber-accent/25",
        glow:
          "bg-cyber-primary text-white hover:bg-cyber-primary/90 shadow-lg shadow-cyber-primary/40 hover:shadow-cyber-primary/60",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
