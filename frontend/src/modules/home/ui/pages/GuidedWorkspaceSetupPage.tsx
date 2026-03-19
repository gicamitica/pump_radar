import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTour } from "@/app/providers/useTour";
import { Skeleton } from "@/shared/ui/components/Skeleton";
import {
  useGuidedSetupState,
  useUpdateStepStatus,
  useSetCurrentStep,
  useResetSetup,
} from "../../application/hooks";
import {
  SetupProgressHeader,
  SetupWizard,
  ContextualPreview,
  QuickStartShortcuts,
  ReadinessChecklist,
  CompletionState,
  SetupTours,
  SetupResourcesWidget,
} from "../components/guided-setup";
import type { SetupStepId, TourSetId } from "../../domain/models";
import { ErrorState } from "@/components/states";

function GuidedSetupSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

const GuidedWorkspaceSetupPage: React.FC = () => {
  const { t } = useTranslation("guidedSetup");
  const { data: setupState, isLoading, error } = useGuidedSetupState();
  const updateStepStatus = useUpdateStepStatus();
  const setCurrentStep = useSetCurrentStep();
  const resetSetup = useResetSetup();
  const { openTour } = useTour();

  const [selectedStepId, setSelectedStepId] = useState<SetupStepId | null>(
    null
  );

  const handleSelectStep = useCallback(
    (stepId: SetupStepId) => {
      setSelectedStepId(stepId);
      setCurrentStep.mutate(stepId);
    },
    [setCurrentStep]
  );

  const handleCompleteStep = useCallback(
    (stepId: SetupStepId) => {
      updateStepStatus.mutate({ stepId, status: "completed" });
    },
    [updateStepStatus]
  );

  const handleSkipStep = useCallback(
    (stepId: SetupStepId) => {
      updateStepStatus.mutate({ stepId, status: "skipped" });
    },
    [updateStepStatus]
  );

  const handleStartTour = useCallback(
    (tourId: TourSetId) => {
      openTour(tourId);
    },
    [openTour]
  );

  const handleReset = useCallback(() => {
    resetSetup.mutate();
    setSelectedStepId(null);
  }, [resetSetup]);

  if (isLoading) {
    return <GuidedSetupSkeleton />;
  }

  if (error || !setupState) {
    return (
      <ErrorState
        title={t("errors.loadFailed")}
        description={t("errors.loadFailedDescription")}
      />
    );
  }

  const isUpdating = updateStepStatus.isPending || setCurrentStep.isPending;

  if (setupState.progress.isComplete) {
    return (
      <div className="p-6">
        <CompletionState onReset={handleReset} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div data-tour="setup-progress">
          <SetupProgressHeader progress={setupState.progress} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2" data-tour="setup-wizard">
            <SetupWizard
              steps={setupState.steps}
              currentStepId={setupState.progress.currentStepId}
              tourCompletions={setupState.tourCompletions}
              onSelectStep={handleSelectStep}
              onCompleteStep={handleCompleteStep}
              onSkipStep={handleSkipStep}
              onStartTour={handleStartTour}
              isUpdating={isUpdating}
            />
          </div>

          <ContextualPreview
            selectedStepId={selectedStepId ?? setupState.progress.currentStepId}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div data-tour="quick-start" className="h-full">
            <QuickStartShortcuts />
          </div>
          <div data-tour="readiness-checks" className="h-full">
            <ReadinessChecklist checks={setupState.readinessChecks} />
          </div>
          <div className="h-full">
            <SetupResourcesWidget />
          </div>
        </div>
      </div>

      <SetupTours />
    </>
  );
};

export default GuidedWorkspaceSetupPage;
