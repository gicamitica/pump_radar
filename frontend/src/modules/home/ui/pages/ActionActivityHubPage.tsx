import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/shared/ui/components/Skeleton";
import { useTour } from "@/app/providers/useTour";
import { POWER_TIPS_TOUR_ID } from "../components/activity-hub/PowerTipsTour";
import {
  useActivityHubState,
  useRecordModuleVisit,
  useToggleShortcutFavorite,
} from "../../application/hooks";
import {
  CommandHero,
  TodaysFocus,
  ActivityStream,
  UtilityRail,
  PowerTipsTour,
} from "../components/activity-hub";

function ActivityHubSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Hero skeleton */}
      <Skeleton className="h-36 w-full rounded-2xl" />

      {/* Two-lane layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Left lane */}
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
        {/* Right lane */}
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

const ActionActivityHubPage: React.FC = () => {
  const { t } = useTranslation("activityHub");
  const { data: hubState, isLoading, error } = useActivityHubState();
  const recordModuleVisit = useRecordModuleVisit();
  const toggleShortcutFavorite = useToggleShortcutFavorite();
  const { openTour } = useTour();

  const handleModuleClick = useCallback(
    (moduleId: string) => {
      recordModuleVisit.mutate(moduleId);
    },
    [recordModuleVisit]
  );

  const handleToggleFavorite = useCallback(
    (shortcutId: string) => {
      toggleShortcutFavorite.mutate(shortcutId);
    },
    [toggleShortcutFavorite]
  );

  const handleStartTour = useCallback(() => {
    openTour(POWER_TIPS_TOUR_ID);
  }, [openTour]);

  if (isLoading) {
    return <ActivityHubSkeleton />;
  }

  if (error || !hubState) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="text-lg font-semibold text-destructive">
            {t("errors.loadFailed")}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {t("errors.loadFailedDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* HERO SECTION - Command & Action Center */}
        <CommandHero
          showPowerTips={!hubState.powerTipsCompleted}
          onStartTour={handleStartTour}
        />

        {/* TWO-LANE LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6">
          {/* LEFT LANE - Primary Content */}
          <main className="space-y-6">
            {/* Today's Focus - Main action engine */}
            <TodaysFocus items={hubState.focusItems} />

            {/* Activity Insights */}
            <ActivityStream
              items={hubState.activityStream}
              hasMore={hubState.activityStream.length >= 10}
            />
          </main>

          {/* RIGHT LANE - Utility Rail */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border bg-muted/30 p-4">
              <UtilityRail
                stats={hubState.quickStats}
                recentModules={hubState.recentModules}
                shortcuts={hubState.shortcuts}
                onModuleClick={handleModuleClick}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          </aside>
        </div>
      </div>

      {/* Power Tips Tour - Only triggered via button, never auto-runs */}
      <PowerTipsTour />
    </>
  );
};

export default ActionActivityHubPage;
