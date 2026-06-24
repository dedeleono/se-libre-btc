import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border-2 text-sm font-bold uppercase tracking-[0.04em] transition-[background,color,box-shadow,transform] active:translate-x-0 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0_hsl(var(--foreground))] hover:bg-[var(--naranja-600)] hover:shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[1px_1px_0_hsl(var(--foreground))] dark:shadow-[3px_3px_0_var(--naranja-500)] dark:active:shadow-[1px_1px_0_var(--naranja-500)]",
        destructive:
          "border-foreground bg-destructive text-destructive-foreground shadow-[3px_3px_0_hsl(var(--foreground))] hover:bg-destructive/90 active:shadow-[1px_1px_0_hsl(var(--foreground))] dark:shadow-[3px_3px_0_var(--naranja-500)] dark:active:shadow-[1px_1px_0_var(--naranja-500)]",
        outline:
          "border-foreground bg-card text-foreground shadow-[3px_3px_0_hsl(var(--foreground))] hover:bg-secondary active:shadow-[1px_1px_0_hsl(var(--foreground))] dark:shadow-[3px_3px_0_var(--naranja-500)] dark:active:shadow-[1px_1px_0_var(--naranja-500)]",
        secondary:
          "border-foreground bg-secondary text-secondary-foreground shadow-[3px_3px_0_hsl(var(--foreground))] hover:bg-[var(--naranja-050)] active:shadow-[1px_1px_0_hsl(var(--foreground))] dark:shadow-[3px_3px_0_var(--naranja-500)] dark:active:shadow-[1px_1px_0_var(--naranja-500)]",
        ghost: "border-transparent bg-transparent text-foreground shadow-none hover:border-foreground hover:bg-secondary",
        link: "border-transparent bg-transparent text-[var(--terracota-700)] shadow-none underline-offset-4 hover:underline dark:text-[var(--maiz-500)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
