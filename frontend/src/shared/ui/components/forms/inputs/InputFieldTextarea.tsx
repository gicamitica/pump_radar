import * as React from "react"
import { Textarea } from "@/shared/ui/shadcn/components/ui/textarea"
import { cn } from "@/shadcn/lib/utils"

export interface InputFieldTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean
}

const InputFieldTextarea = React.forwardRef<HTMLTextAreaElement, InputFieldTextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <Textarea
        className={cn(
          hasError && "pr-8",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
InputFieldTextarea.displayName = "InputFieldTextarea"

export { InputFieldTextarea }
