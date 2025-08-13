import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--stedi-primary)] text-white rounded-md border-none hover:bg-[var(--stedi-primary-dark)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
        destructive:
          "bg-[var(--stedi-error)] text-white rounded-md border-none hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
        outline:
          "bg-transparent text-[var(--stedi-primary)] border border-[var(--stedi-primary)] rounded-md hover:bg-[var(--stedi-primary-light)]",
        secondary:
          "bg-[var(--stedi-light-gray)] text-[var(--stedi-dark-gray)] rounded-md border-none hover:bg-gray-200",
        ghost:
          "bg-transparent text-[var(--stedi-dark-gray)] border-none rounded-md hover:bg-[var(--stedi-light-gray)]",
        link: "text-[var(--stedi-primary)] underline-offset-4 hover:underline bg-transparent border-none",
        success:
          "bg-[var(--stedi-success)] text-white rounded-md border-none hover:bg-green-600 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
        warning:
          "bg-[var(--stedi-warning)] text-white rounded-md border-none hover:bg-orange-600 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
        teal:
          "bg-[var(--stedi-teal)] text-white rounded-md border-none hover:bg-[var(--stedi-teal-dark)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]",
      },
      size: {
        default: "h-10 px-6 py-3 has-[>svg]:px-4",
        sm: "h-8 px-3 py-1.5 text-xs has-[>svg]:px-2",
        lg: "h-12 px-8 py-3 text-base has-[>svg]:px-6",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
