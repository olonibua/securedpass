import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border bg-white px-4 py-3 text-base transition-all duration-200 outline-none",
        "border-[#CCCCCC] text-[var(--stedi-black)] placeholder:text-[var(--stedi-medium-gray)]",
        "focus:border-[var(--stedi-primary)] focus:shadow-[0_0_0_3px_rgba(0,82,255,0.1)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "selection:bg-[var(--stedi-primary)] selection:text-white",
        "aria-invalid:border-[var(--stedi-error)] aria-invalid:focus:shadow-[0_0_0_3px_rgba(255,68,68,0.1)]",
        "dark:bg-[var(--stedi-black)] dark:border-[var(--stedi-medium-gray)] dark:text-[var(--stedi-white)]",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
