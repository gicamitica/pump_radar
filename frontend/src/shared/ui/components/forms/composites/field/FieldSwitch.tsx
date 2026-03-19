import * as React from 'react'
import { Switch } from '@/shared/ui/shadcn/components/ui/switch'
import { Label } from '@/shared/ui/shadcn/components/ui/label'
import { FieldLayout } from '../../core/FieldLayout'
import { cn } from '@/shadcn/lib/utils'
import { ActionCard } from '@/components/ActionCard'

export interface FieldSwitchProps {
  label?: string
  description?: string
  required?: boolean

  status?: 'default' | 'success' | 'warning' | 'error'
  statusMessage?: string
  isLoading?: boolean

  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean

  /** Content to show next to the switch (like a compact label) */
  children?: React.ReactNode
}

/**
 * FieldSwitch - A single boolean switch with label, description and status handling.
 */
export function FieldSwitch({
  label,
  description,
  required,
  status = 'default',
  statusMessage,
  isLoading,
  id,
  checked,
  onCheckedChange,
  disabled,
  children,
}: FieldSwitchProps) {
  return (
    <FieldLayout
      id={id}
      label={label}
      description={description}
      required={required}
      isLoading={isLoading}
      status={status}
      statusMessage={statusMessage}
    >
      <ActionCard
        active={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange?.(!checked)}
      >
        <div className="flex-1 min-w-0 pr-6">
          <Label
            htmlFor={id}
            className={cn(
              "text-sm font-bold cursor-pointer select-none",
              checked ? "text-primary" : "text-foreground"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </Label>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            id={id}
            checked={checked}
            onCheckedChange={onCheckedChange}
            disabled={disabled}
          />
        </div>
      </ActionCard>
    </FieldLayout>
  )
}

export default FieldSwitch
