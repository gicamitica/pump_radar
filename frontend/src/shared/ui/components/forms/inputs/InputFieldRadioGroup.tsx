import * as React from 'react'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/components/ui/radio-group'
import { Label } from '@/shared/ui/shadcn/components/ui/label'
import { cn } from '@/shadcn/lib/utils'
import { ActionCard } from '@/shared/ui/components/ActionCard'

export interface RadioOption<T = string> {
  value: T
  title: string
  description?: string

  /** Optional custom content below description */
  secondary?: React.ReactNode

  /** Optional media (icon, image, card, etc.) */
  media?: React.ReactNode

  disabled?: boolean
}

export interface InputFieldRadioGroupProps<T = string> {
  value: T | null
  onChange: (value: T) => void
  options: RadioOption<T>[]

  variant?: 'list' | 'card'
  alignment?: 'start' | 'end'
  contentAlign?: 'start' | 'center' | 'end'
  mediaPosition?: 'start' | 'end'
  columns?: number


  disabled?: boolean
  hasError?: boolean
  id?: string

  renderOption?: (
    option: RadioOption<T>,
    state: {
      checked: boolean
      disabled: boolean
    }
  ) => React.ReactNode
}

/**
 * InputFieldRadioGroup - Pure input mechanics for radio decisions.
 */
export function InputFieldRadioGroup<T = string>({
  value,
  onChange,
  options,
  variant = 'list',
  alignment = 'start',
  contentAlign = 'start',
  mediaPosition = 'start',
  columns,
  disabled = false,
  hasError = false,
  renderOption,
  id,
}: InputFieldRadioGroupProps<T>) {

  const columnClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }
  
  const handleValueChange = (val: string) => {
    // Find the option object to get the original value type
    // We assume stringifying keys works for simple types, but ideally T is string/number.
    // If T is an object, consumers must ensure 'value' on option is stable or primitive for this lookup.
    // For standard decision groups, values are usually strings/enums.
    const option = options.find(o => String(o.value) === val)
    if (option) {
      onChange(option.value)
    }
  }

  // Convert current value to string match
  const stringValue = value !== null ? String(value) : undefined

  return (
    <RadioGroup
      value={stringValue}
      onValueChange={handleValueChange}
      disabled={disabled}
      id={id}
      className={cn(
        "gap-3",
        variant === 'list' && "flex flex-col gap-0 divide-y rounded-md border",
        variant === 'card' && (
          columns 
            ? ["grid gap-4", columnClasses[columns] || 'grid-cols-3'] 
            : "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )
      )}

    >
      {options.map((option, index) => {
        const optionValueString = String(option.value)
        const isChecked = optionValueString === stringValue
        const isDisabled = disabled || option.disabled || false

        if (renderOption) {
          return (
            <div key={optionValueString}>
               {/* Wrapper to hold the radio item mechanics hidden or integrated if the user renders it? 
                   If the user uses renderOption, they might want full control.
                   However, we must ensure the RadioGroupItem is present for a11y/mechanics unless they render it.
                   It often implies we wrapping a RadioGroupItem around custom content OR rendering the Item inside.
                   Let's wrap the RadioGroupItem in a way that allows custom content but maintains `value`.
                   Actually, standard pattern: Custom Label connecting to the Item.
               */}
               <RadioGroupItem value={optionValueString} id={`${id}-opt-${index}`} className="sr-only" />
               <Label htmlFor={`${id}-opt-${index}`} className="cursor-pointer">
                 {renderOption(option, { checked: isChecked, disabled: isDisabled })}
               </Label>
            </div>
          )
        }

        return (
          <ActionCard
            key={optionValueString}
            active={isChecked}
            disabled={isDisabled}
            className={cn(
              "relative flex transition-all outline-none p-0 overflow-visible", // Reset some ActionCard defaults if needed
              
              // Vertical Alignment (Cross Axis)
              contentAlign === 'start' && "items-start",
              contentAlign === 'center' && "items-center",
              contentAlign === 'end' && "items-end",

              // Variant: List
              variant === 'list' && [
                "hover:bg-muted/50",
                // isChecked && "bg-muted/50 z-10",
                isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                "first:rounded-t-md last:rounded-b-md border-0"
              ],

              // Variant: Card
              variant === 'card' && [
                !isChecked && "bg-muted/60 border-transparent hover:bg-muted/70 dark:bg-muted/20 dark:hover:bg-muted/40",
                hasError && !isChecked && "border-destructive",
              ],
            )}
          >
            <Label
              htmlFor={`${id}-opt-${index}`}
              className={cn(
                "flex w-full min-h-full p-4 cursor-pointer",
                isDisabled && "cursor-not-allowed",
                // Vertical Alignment (Cross Axis) - Sync with parent for safety
                contentAlign === 'start' && "items-start",
                contentAlign === 'center' && "items-center",
                contentAlign === 'end' && "items-end",
              )}
            >
              {/* 1. Radio Indicator (Start) */}
              {alignment === 'start' && (
                <div className="mr-4 shrink-0 mt-0.5">
                  <RadioGroupItem 
                    value={optionValueString} 
                    id={`${id}-opt-${index}`} 
                    aria-describedby={option.description ? `${id}-opt-${index}-desc` : undefined}
                    disabled={isDisabled}
                  />
                </div>
              )}

              {/* 2. Media (Start) */}
              {option.media && mediaPosition === 'start' && (
                <div className="mr-4 shrink-0 text-muted-foreground pointer-events-none">
                  {option.media}
                </div>
              )}

              {/* 3. Content */}
              <div className="flex-1 min-w-0 h-full pointer-events-none">
                <div className="flex flex-col h-full justify-center">
                  <span className={cn(
                    "text-sm font-bold mb-0.5 transition-colors",
                    isChecked ? "text-primary" : "text-foreground"
                  )}>
                    {option.title}
                  </span>
                  
                  {option.description && (
                    <p 
                      id={`${id}-opt-${index}-desc`} 
                      className="text-xs text-muted-foreground leading-relaxed italic"
                    >
                      {option.description}
                    </p>
                  )}

                  {option.secondary && (
                    <div className="mt-2">
                      {option.secondary}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Media (End) */}
              {option.media && mediaPosition === 'end' && (
                <div className="ml-4 shrink-0 text-muted-foreground pointer-events-none">
                  {option.media}
                </div>
              )}

              {/* 5. Radio Indicator (End) */}
              {alignment === 'end' && (
                <div className="ml-4 shrink-0 mt-0.5">
                  <RadioGroupItem 
                    value={optionValueString} 
                    id={`${id}-opt-${index}`} 
                    aria-describedby={option.description ? `${id}-opt-${index}-desc` : undefined}
                    disabled={isDisabled}
                  />
                </div>
              )}
            </Label>
          </ActionCard>
        )
      })}
    </RadioGroup>
  )
}
