import type { ReactNode } from 'react';

export type WizardStepId = string;

export type WizardStepStatus =
  | 'upcoming'
  | 'active'
  | 'complete'
  | 'skipped'
  | 'error'
  | 'blocked';

export type WizardValidationResult =
  | { ok: true }
  | { ok: false; errors: string[]; fieldErrors?: Record<string, string> };

export type WizardStep<T extends Record<string, unknown>> = {
  id: WizardStepId;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;

  optional?: boolean;
  isVisible?: (values: T) => boolean;

  canEnter?: (values: T) => boolean | Promise<boolean>;
  canExit?: (values: T) => WizardValidationResult | Promise<WizardValidationResult>;

  next?: (values: T) => WizardStepId | null | Promise<WizardStepId | null>;

  render: (api: WizardRenderApi<T>) => ReactNode;
};

export type WizardNavigationPolicy = 'visited-only' | 'free';

export type WizardStepperVariant =
  | 'chevron'
  | 'radio'
  | 'circles'
  | 'icon-underline'
  | 'status';

export type WizardStepperSize = 'sm' | 'md' | 'lg';

export type WizardProps<T extends Record<string, unknown>> = {
  steps: WizardStep<T>[];
  initialValues: T;
  startAt?: WizardStepId;

  onFinish: (values: T) => void | Promise<void>;
  onCancel?: () => void;
  onStepChange?: (from: WizardStepId, to: WizardStepId, values: T) => void;

  navigationPolicy?: WizardNavigationPolicy;

  className?: string;
  children?: ReactNode;

  headerVariant?: WizardStepperVariant;
  headerSize?: WizardStepperSize;
  headerClassName?: string;

  footerClassName?: string;
  cancelLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  skipLabel?: string;
  labels?: Record<string, ReactNode>;
  mobileLabels?: Record<string, ReactNode>;
  showCancel?: boolean;
};

export type WizardContextValue<T extends Record<string, unknown>> = {
  steps: WizardStep<T>[];
  visibleSteps: WizardStep<T>[];
  visibleStepIds: WizardStepId[];
  activeStepId: WizardStepId;
  activeStep: WizardStep<T> | null;

  labels?: Record<string, ReactNode>;
  mobileLabels?: Record<string, ReactNode>;

  values: T;
  setValues: (partial: Partial<T>) => void;

  history: WizardStepId[];
  statusById: Record<WizardStepId, WizardStepStatus | undefined>;
  getStepStatus: (id: WizardStepId) => WizardStepStatus;

  errors: WizardValidationResult | null;
  clearErrors: () => void;

  isBusy: boolean;

  isFirstStep: boolean;
  isLastStep: boolean;

  canGoTo: (id: WizardStepId) => boolean;

  goTo: (id: WizardStepId) => Promise<void>;
  next: () => Promise<void>;
  previous: () => void;
  skip: () => Promise<void>;
  finish: () => Promise<void>;
  cancel: () => void;
};

export type WizardRenderApi<T extends Record<string, unknown>> = {
  values: T;
  setValues: (partial: Partial<T>) => void;
  errors: WizardValidationResult | null;

  activeStepId: WizardStepId;
  isBusy: boolean;

  next: () => Promise<void>;
  previous: () => void;
  goTo: (id: WizardStepId) => Promise<void>;
  skip: () => Promise<void>;
  finish: () => Promise<void>;
};
