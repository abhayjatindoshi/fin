import * as React from "react"

import { cn } from "@/modules/base-ui/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const inputVariants = cva(
  [
    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground  border-input h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    "relative [&::-webkit-outer-spin-button]:!appearance-[inner-spin-button] [&::-webkit-outer-spin-button]:w-[25px] [&::-webkit-outer-spin-button]:absolute [&::-webkit-outer-spin-button]:top-0 [&::-webkit-outer-spin-button]:right-0 [&::-webkit-outer-spin-button]:h-full [&::-webkit-inner-spin-button]:!appearance-[inner-spin-button] [&::-webkit-inner-spin-button]:w-[25px] [&::-webkit-inner-spin-button]:absolute [&::-webkit-inner-spin-button]:top-0 [&::-webkit-inner-spin-button]:right-0 [&::-webkit-inner-spin-button]:h-full",
  ],
  {
    variants: {
      variant: {
        default: "dark:bg-input/30 border bg-transparent",
        ghost: "bg-transparent border-0 focus-visible:outline-0 focus-visible:ring-0 focus:ring-0 focus:border-0 focus:outline-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Input({
  className,
  variant,
  type,
  ...props
}: React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants>
) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Input }

