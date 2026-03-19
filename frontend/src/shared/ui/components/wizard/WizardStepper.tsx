import type { ReactElement } from 'react';
import { useWizard } from './WizardContext';
import type { WizardStepperSize, WizardStepperVariant } from './types';
import {
  ChevronStepper,
  RadioStepper,
  CirclesStepper,
  IconUnderlineStepper,
  StatusStepper,
} from './variants';

export type WizardStepperProps = {
  className?: string;
  variant?: WizardStepperVariant;
  size?: WizardStepperSize;
};

/**
 * WizardStepper - Visual stepper component for the wizard
 * 
 * Displays the wizard steps in various visual styles:
 * - chevron: Breadcrumb-style with arrow connectors (Style 01)
 * - radio: Horizontal dots with progress line (Style 02)
 * - circles: Numbered circles with connecting lines (Style 03)
 * - icon-underline: Icons with progress bar below (Style 04)
 * - status: Vertical timeline with status labels (Style 05)
 */
export function WizardStepper({ 
  className, 
  variant = 'circles', 
  size = 'md' 
}: WizardStepperProps): ReactElement {
  const { visibleSteps, activeStepId, getStepStatus, canGoTo, goTo, labels, mobileLabels } = useWizard();

  const commonProps = {
    steps: visibleSteps,
    activeStepId,
    getStepStatus,
    canGoTo,
    goTo,
    size,
    className,
    labels,
    mobileLabels,
  };

  switch (variant) {
    case 'chevron':
      return <ChevronStepper {...commonProps} />;
    
    case 'radio':
      return <RadioStepper {...commonProps} />;
    
    case 'icon-underline':
      return <IconUnderlineStepper {...commonProps} />;
    
    case 'status':
      return <StatusStepper {...commonProps} />;
    
    case 'circles':
    default:
      return <CirclesStepper {...commonProps} />;
  }
}

export default WizardStepper;
