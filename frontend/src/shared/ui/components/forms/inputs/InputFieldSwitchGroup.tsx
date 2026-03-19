import * as React from 'react'
import { Switch } from '@/shared/ui/shadcn/components/ui/switch'
import { Label } from '@/shared/ui/shadcn/components/ui/label'
import { cn } from '@/shadcn/lib/utils'
import { ActionCard } from '@/shared/ui/components/ActionCard'

export interface SwitchOption<T = string> {
  value: T
  title: string
  description?: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface InputFieldSwitchGroupProps<T = string> {
  /** Array of active option values */
  value: T[]
  /** Callback fired when the selection changes */
  onChange: (value: T[]) => void
  /** List of switchable options */
  options: SwitchOption<T>[]
  
  /** Grid columns configuration */
  columns?: number
  /** Overall disabled state */
  disabled?: boolean
  /** Base ID for accessibility */
  id?: string
}

/**
 * InputFieldSwitchGroup - A group of boolean switches presented as interactive cards.
 * Follows the pattern of InputFieldRadioGroup but for multi-select boolean states.
 */
export function InputFieldSwitchGroup<T = string>({
  value = [],
  onChange,
  options,
  columns,
  disabled = false,
  id,
}: InputFieldSwitchGroupProps<T>) {

  const columnClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  const handleToggle = (optionValue: T) => {
    if (disabled) return
    
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    
    onChange(newValue)
  }

  return (
    <div
      id={id}
      className={cn(
        "grid gap-3",
        columns ? columnClasses[columns] || 'grid-cols-1' : "grid-cols-1"
      )}
    >
      {options.map((option, index) => {
        const isChecked = value.includes(option.value)
        const isDisabled = disabled || option.disabled
        // Use string representation for ID and key
        const optionKey = String(option.value)
        const itemId = `${id}-opt-${index}`

        return (
          <ActionCard
            key={optionKey}
            active={isChecked}
            disabled={isDisabled}
            onClick={() => !isDisabled && handleToggle(option.value)}
            className={cn(
              "flex items-center justify-between",
            )}
            role="button"
            aria-pressed={isChecked}
            tabIndex={isDisabled ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                handleToggle(option.value)
              }
            }}
          >
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 mb-1">
                {option.icon && <div className="text-primary shrink-0">{option.icon}</div>}
                <Label 
                  htmlFor={itemId}
                  className={cn(
                    "text-sm font-bold cursor-pointer select-none", 
                    isChecked ? "text-primary" : "text-foreground",
                    isDisabled && "cursor-not-allowed"
                  )}
                  onClick={(e) => e.stopPropagation()} // Let the parent div handle it
                >
                  {option.title}
                </Label>
              </div>
              {option.description && (
                <p className="text-xs text-muted-foreground leading-relaxed italic select-none">
                  {option.description}
                </p>
              )}
            </div>
            
            <div onClick={(e) => e.stopPropagation()}>
               <Switch 
                  id={itemId}
                  checked={isChecked} 
                  onCheckedChange={() => handleToggle(option.value)}
                  disabled={isDisabled}
               />
            </div>
          </ActionCard>
        )
      })}
    </div>
  )
}
