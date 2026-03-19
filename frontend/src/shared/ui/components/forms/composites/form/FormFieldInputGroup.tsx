import React from 'react';
import { useController, type Control, type FieldValues, type FieldPath } from 'react-hook-form'
import FieldInputGroup from '../field/FieldInputGroup';

interface FormFieldInputGroupProps<TFieldValues extends FieldValues = FieldValues> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue'> {
    /** RHF */
    name: FieldPath<TFieldValues>
    control: Control<TFieldValues>

    /** Field chrome */
    label?: string;
    description?: string;
    required?: boolean;

    /** State */
    isLoading?: boolean;

    /** InputGroup specific */
    addonStart?: React.ReactNode;
    addonEnd?: React.ReactNode;

    iconStart?: React.ReactNode;
    iconEnd?: React.ReactNode;

    actionStart?: React.ReactNode;
    actionEnd?: React.ReactNode;
    onActionStartClick?: () => void;
    onActionEndClick?: () => void;
}

export function FormFieldInputGroup<TFieldValues extends FieldValues>({
    name,
    control,
    label, // Intercept label
    description, // Intercept description
    required,
    disabled,
    isLoading,
    // placeholder, type, className, autoFocus -> these go into ...props

    addonStart,
    addonEnd,
    iconStart,
    iconEnd,
    actionStart,
    actionEnd,
    onActionStartClick,
    onActionEndClick,

    ...props
}: FormFieldInputGroupProps<TFieldValues>) {
    const {
        field,
        fieldState,
    } = useController({
        name,
        control,
    })

    // Helper to map RHF errors to our FieldStatus
    const status = fieldState.error ? 'error' : undefined
    const statusMessage = fieldState.error?.message

    return (
        <FieldInputGroup
            id={field.name}
            // Base props
            label={label}
            description={description}
            required={required}
            isLoading={isLoading}
            status={status}
            statusMessage={statusMessage}

            // InputGroup slots
            addonStart={addonStart}
            addonEnd={addonEnd}
            iconStart={iconStart}
            iconEnd={iconEnd}
            actionStart={actionStart}
            actionEnd={actionEnd}
            onActionStartClick={onActionStartClick}
            onActionEndClick={onActionEndClick}

            // Input props (overrides allowed)
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}

            // Spread rest (allows overriding onChange, etc if needed, though usually we utilize field.onChange)
            {...props}
        />
    )
}
