import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { WizardContext } from './WizardContext';
import { WizardHeader } from './WizardHeader';
import { WizardContent } from './WizardContent';
import { WizardFooter } from './WizardFooter';
import type {
  WizardContextValue,
  WizardProps,
  WizardStep,
  WizardStepId,
  WizardStepStatus,
  WizardValidationResult,
} from './types';

function computeVisibleSteps<T extends Record<string, unknown>>(steps: WizardStep<T>[], values: T): WizardStep<T>[] {
  return steps.filter((s) => (s.isVisible ? s.isVisible(values) : true));
}

function findStep<T extends Record<string, unknown>>(steps: WizardStep<T>[], id: WizardStepId): WizardStep<T> | null {
  return steps.find((s) => s.id === id) ?? null;
}

function defaultStatusForId(
  id: WizardStepId,
  activeStepId: WizardStepId,
  statusById: Record<WizardStepId, WizardStepStatus | undefined>
): WizardStepStatus {
  if (id === activeStepId) return 'active';
  return statusById[id] ?? 'upcoming';
}

async function normalizeValidationResult(
  result: WizardValidationResult | boolean
): Promise<WizardValidationResult> {
  if (typeof result === 'boolean') {
    return result ? { ok: true } : { ok: false, errors: ['Blocked'] };
  }
  return result;
}

export function Wizard<T extends Record<string, unknown>>({
  steps,
  initialValues,
  startAt,
  onFinish,
  onCancel,
  onStepChange,
  navigationPolicy = 'visited-only',
  className,
  children,
  headerVariant = 'circles',
  headerSize = 'md',
  headerClassName,
  footerClassName,
  cancelLabel,
  previousLabel,
  nextLabel,
  finishLabel,
  skipLabel,
  showCancel,
  labels,
  mobileLabels,
}: WizardProps<T>): ReactElement {
  const [values, setValuesState] = useState<T>(initialValues);
  const [history, setHistory] = useState<WizardStepId[]>([]);
  const [statusById, setStatusById] = useState<Record<WizardStepId, WizardStepStatus | undefined>>({});
  const [errors, setErrors] = useState<WizardValidationResult | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const opRef = useRef(0);

  const allStepIds = useMemo(() => steps.map((s) => s.id), [steps]);

  const visibleSteps = useMemo(() => computeVisibleSteps(steps, values), [steps, values]);
  const visibleStepIds = useMemo(() => visibleSteps.map((s) => s.id), [visibleSteps]);

  const initialActiveId = useMemo<WizardStepId>(() => {
    const start = startAt && allStepIds.includes(startAt) ? startAt : null;
    const startVisible = start && visibleStepIds.includes(start) ? start : null;
    return startVisible ?? visibleStepIds[0] ?? (steps[0]?.id ?? '');
  }, [allStepIds, startAt, steps, visibleStepIds]);

  const [activeStepId, setActiveStepId] = useState<WizardStepId>(initialActiveId);

  const activeStep = useMemo(() => findStep(steps, activeStepId), [steps, activeStepId]);

  const activeIndex = useMemo(() => Math.max(0, visibleStepIds.indexOf(activeStepId)), [visibleStepIds, activeStepId]);

  const isFirstStep = activeIndex === 0;
  const isLastStep = visibleStepIds.length > 0 && activeIndex === visibleStepIds.length - 1;

  const setValues = useCallback((partial: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...partial }));
    setErrors(null);
  }, []);

  const runFinish = useCallback(async (): Promise<boolean> => {
    try {
      await onFinish(values);
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Finish failed';
      setErrors({ ok: false, errors: [message] });
      return false;
    }
  }, [onFinish, values]);

  const clearErrors = useCallback(() => setErrors(null), []);

  const setStepStatus = useCallback((id: WizardStepId, status: WizardStepStatus) => {
    setStatusById((prev) => ({ ...prev, [id]: status }));
  }, []);

  const getStepStatus = useCallback(
    (id: WizardStepId): WizardStepStatus => defaultStatusForId(id, activeStepId, statusById),
    [activeStepId, statusById]
  );

  const canGoTo = useCallback(
    (id: WizardStepId): boolean => {
      if (!visibleStepIds.includes(id)) return false;
      if (id === activeStepId) return true;

      if (navigationPolicy === 'free') return true;

      const status = statusById[id];
      if (status && status !== 'upcoming') return true;

      return history.includes(id);
    },
    [activeStepId, history, navigationPolicy, statusById, visibleStepIds]
  );

  const runBusy = useCallback(async <R,>(fn: () => Promise<R>): Promise<R | undefined> => {
    const opId = ++opRef.current;
    setIsBusy(true);

    try {
      const result = await fn();
      if (opRef.current !== opId) return undefined;
      return result;
    } finally {
      if (opRef.current === opId) {
        setIsBusy(false);
      }
    }
  }, []);

  const resolveNextStepId = useCallback(
    async (fromId: WizardStepId): Promise<WizardStepId | null> => {
      const step = findStep(steps, fromId);
      if (!step) return null;

      if (step.next) {
        const nextId = await step.next(values);
        return nextId;
      }

      const idx = visibleStepIds.indexOf(fromId);
      if (idx === -1) return visibleStepIds[0] ?? null;
      return visibleStepIds[idx + 1] ?? null;
    },
    [steps, values, visibleStepIds]
  );

  const canEnterStep = useCallback(
    async (id: WizardStepId): Promise<boolean> => {
      const step = findStep(steps, id);
      if (!step) return false;
      if (!step.canEnter) return true;

      const ok = await step.canEnter(values);
      return Boolean(ok);
    },
    [steps, values]
  );

  const canExitActiveStep = useCallback(async (): Promise<WizardValidationResult> => {
    if (!activeStep) return { ok: true };
    if (!activeStep.canExit) return { ok: true };

    const res = await activeStep.canExit(values);
    return normalizeValidationResult(res as WizardValidationResult);
  }, [activeStep, values]);

  const transitionTo = useCallback(
    async (to: WizardStepId, opts: { pushHistory: boolean; from: WizardStepId }) => {
      const { from, pushHistory } = opts;

      const ok = await canEnterStep(to);
      if (!ok) {
        setStepStatus(to, 'blocked');
        return;
      }

      if (pushHistory) {
        setHistory((prev) => [...prev, from]);
      }

      onStepChange?.(from, to, values);
      setActiveStepId(to);
      setErrors(null);
    },
    [canEnterStep, onStepChange, setStepStatus, values]
  );

  const next = useCallback(async (): Promise<void> => {
    if (!activeStep) return;
    if (isBusy) return;

    await runBusy(async () => {
      const validation = await canExitActiveStep();
      if (!validation.ok) {
        setErrors(validation);
        setStepStatus(activeStep.id, 'error');
        return;
      }

      const to = await resolveNextStepId(activeStep.id);
      if (to === null) {
        const ok = await runFinish();
        setStepStatus(activeStep.id, ok ? 'complete' : 'error');
        return;
      }

      setStepStatus(activeStep.id, 'complete');
      await transitionTo(to, { pushHistory: true, from: activeStep.id });
    });
  }, [activeStep, canExitActiveStep, isBusy, resolveNextStepId, runBusy, runFinish, setStepStatus, transitionTo]);

  const finish = useCallback(async (): Promise<void> => {
    if (!activeStep) return;
    if (isBusy) return;

    await runBusy(async () => {
      const validation = await canExitActiveStep();
      if (!validation.ok) {
        setErrors(validation);
        setStepStatus(activeStep.id, 'error');
        return;
      }

      const ok = await runFinish();
      setStepStatus(activeStep.id, ok ? 'complete' : 'error');
    });
  }, [activeStep, canExitActiveStep, isBusy, runBusy, runFinish, setStepStatus]);

  const previous = useCallback(() => {
    if (isBusy) return;

    setHistory((prev) => {
      const nextHistory = [...prev];

      while (nextHistory.length > 0) {
        const candidate = nextHistory.pop();
        if (candidate && visibleStepIds.includes(candidate)) {
          const from = activeStepId;
          onStepChange?.(from, candidate, values);
          setActiveStepId(candidate);
          setErrors(null);
          break;
        }
      }

      return nextHistory;
    });
  }, [activeStepId, isBusy, onStepChange, values, visibleStepIds]);

  const skip = useCallback(async (): Promise<void> => {
    if (!activeStep) return;
    if (!activeStep.optional) return;
    if (isBusy) return;

    await runBusy(async () => {
      setStepStatus(activeStep.id, 'skipped');

      const to = await resolveNextStepId(activeStep.id);
      if (to === null) {
        await runFinish();
        return;
      }

      await transitionTo(to, { pushHistory: true, from: activeStep.id });
    });
  }, [activeStep, isBusy, resolveNextStepId, runBusy, runFinish, setStepStatus, transitionTo]);

  const goTo = useCallback(
    async (id: WizardStepId): Promise<void> => {
      if (!canGoTo(id)) return;
      if (id === activeStepId) return;
      if (isBusy) return;

      if (navigationPolicy === 'visited-only') {
        await runBusy(async () => {
          const idx = history.lastIndexOf(id);
          const nextHistory = idx >= 0 ? history.slice(0, idx) : history;

          const ok = await canEnterStep(id);
          if (!ok) {
            setStepStatus(id, 'blocked');
            return;
          }

          setHistory(nextHistory);
          onStepChange?.(activeStepId, id, values);
          setActiveStepId(id);
          setErrors(null);
        });

        return;
      }

      await transitionTo(id, { pushHistory: true, from: activeStepId });
    },
    [activeStepId, canEnterStep, canGoTo, history, isBusy, navigationPolicy, onStepChange, runBusy, setStepStatus, transitionTo, values]
  );

  const cancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (visibleStepIds.length === 0) return;

    if (!visibleStepIds.includes(activeStepId)) {
      const lastVisibleFromHistory = [...history].reverse().find((id) => visibleStepIds.includes(id));
      const fallback = lastVisibleFromHistory ?? visibleStepIds[0];
      setActiveStepId(fallback);
      setHistory((prev) => prev.filter((id) => visibleStepIds.includes(id)));
      setErrors(null);
    }
  }, [activeStepId, history, visibleStepIds]);

  const contextValue: WizardContextValue<T> = useMemo(
    () => ({
      steps,
      visibleSteps,
      visibleStepIds,
      activeStepId,
      activeStep,
      values,
      setValues,
      history,
      statusById,
      getStepStatus,
      errors,
      clearErrors,
      isBusy,
      isFirstStep,
      isLastStep,
      canGoTo,
      goTo,
      next,
      previous,
      skip,
      finish,
      cancel,
      labels,
      mobileLabels,
    }),
    [
      steps,
      visibleSteps,
      visibleStepIds,
      activeStepId,
      activeStep,
      values,
      setValues,
      history,
      statusById,
      getStepStatus,
      errors,
      clearErrors,
      isBusy,
      isFirstStep,
      isLastStep,
      canGoTo,
      goTo,
      next,
      previous,
      skip,
      finish,
      cancel,
      labels,
      mobileLabels,
    ]
  );

  return (
    <WizardContext.Provider value={contextValue}>
      {children ? (
        <div className={cn('flex flex-col wizard', className)}>{children}</div>
      ) : (
        <div className={cn('flex flex-col wizard', className)}>
          {headerVariant === 'status' ? (
             <div className="flex flex-row flex-1 gap-8 min-h-0">
               <WizardHeader 
                 className={cn("w-auto shrink-0 pr-6 mr-2", headerClassName)} 
                 variant={headerVariant} 
                 size={headerSize} 
               />
               <div className="flex flex-col flex-1 w-full min-w-0">
                 <WizardContent className='py-0' />
               </div>
             </div>
          ) : (
             <>
               <WizardHeader className={headerClassName} variant={headerVariant} size={headerSize} />
               <WizardContent />
             </>
          )}

          <WizardFooter
            className={footerClassName}
            cancelLabel={cancelLabel}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
            finishLabel={finishLabel}
            skipLabel={skipLabel}
            showCancel={showCancel}
          />
        </div>
      )}
    </WizardContext.Provider>
  );
}

Wizard.Header = WizardHeader;
Wizard.Content = WizardContent;
Wizard.Footer = WizardFooter;

export default Wizard;
