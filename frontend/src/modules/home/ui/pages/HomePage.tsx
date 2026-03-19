import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/shared/ui/components/Skeleton";
import { useTour } from "@/app/providers/useTour";
import {
  useHomeDashboard,
  useUpdateChecklistItem,
  // useSkipTour,
} from "../../application/hooks";
import {
  WelcomeWidget,
  SystemSnapshotWidget,
  ChecklistWidget,
  QuickActionsWidget,
  RecentActivityWidget,
  AppsExplorerWidget,
  AdminTour,
  ADMIN_TOUR_ID,
  // TourConsentModal,
} from "../components";
import { ErrorState } from "@/components/states";

function HomePageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

const HomePage: React.FC = () => {
  const { t } = useTranslation("home");
  const { data: dashboard, isLoading, error } = useHomeDashboard();
  const updateChecklist = useUpdateChecklistItem();
  // const skipTour = useSkipTour();
  const { isTourCompleted, openTour } = useTour();

  // const [showTourConsent, setShowTourConsent] = useState(false);

  // Check localStorage for tour completion (combines with server state)
  const tourCompletedLocally = isTourCompleted(ADMIN_TOUR_ID);
  const tourCompleted = dashboard?.tourCompleted || tourCompletedLocally;

  const handleStartTour = useCallback(() => {
    openTour(ADMIN_TOUR_ID);
  }, [openTour]);

  const handleToggleChecklistItem = useCallback(
    (itemId: string, completed: boolean) => {
      updateChecklist.mutate({ itemId, completed });
    },
    [updateChecklist]
  );

  if (isLoading) {
    return <HomePageSkeleton />;
  }

  if (error || !dashboard) {
    return (
      <ErrorState
        title={t("errors.loadFailed")}
        description={t("errors.loadFailedDescription")}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <WelcomeWidget
          userName={dashboard.user.name}
          userAvatarUrl={dashboard.user.avatarUrl}
          workspaceName={dashboard.workspace.name}
          environment={dashboard.workspace.environment}
          stats={dashboard.stats}
          tourCompleted={tourCompleted}
          onStartTour={handleStartTour}
        />

        <SystemSnapshotWidget stats={dashboard.stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChecklistWidget
            items={dashboard.checklist}
            onToggleItem={handleToggleChecklistItem}
            isUpdating={updateChecklist.isPending}
          />
          <RecentActivityWidget activities={dashboard.recentActivity} />
        </div>

        <QuickActionsWidget />

        <AppsExplorerWidget apps={dashboard.apps} />
      </div>

      {/* <TourConsentModal
        open={showTourConsent}
        onStartTour={handleStartTour}
        onSkip={handleSkipTour}
      /> */}

      <AdminTour />
    </>
  );
};

export default HomePage;
