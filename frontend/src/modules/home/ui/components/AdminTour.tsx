import { useTranslation } from "react-i18next";
import { GuidedTour, type TourStep } from "@/shared/ui/components/GuidedTour";
import { useTour } from "@/app/providers/useTour";

/** Tour ID for localStorage persistence */
export const ADMIN_TOUR_ID = "admin-home-tour";

export function AdminTour() {
  const { t } = useTranslation("home");
  const { isTourOpen, currentTourId, closeTour, finishTour } = useTour();

  const steps: TourStep[] = [
    {
      target: '[data-tour="welcome"]',
      title: t("tour.steps.home.title"),
      content: t("tour.steps.home.content"),
      position: "bottom",
    },
    {
      target: '[data-tour="stats"]',
      title: t("tour.steps.stats.title", "System Statistics"),
      content: t(
        "tour.steps.stats.content",
        "View key metrics about your workspace at a glance. Click any card to see more details."
      ),
      position: "bottom",
    },
    {
      target: '[data-tour="quick-actions"]',
      title: t("tour.steps.quickActions.title", "Quick Actions"),
      content: t(
        "tour.steps.quickActions.content",
        "Perform common tasks quickly without leaving the dashboard."
      ),
      position: "top",
    },
    {
      target: '[data-sidebar-item="users"]',
      title: t("tour.steps.users.title"),
      content: t("tour.steps.users.content"),
      position: "right",
    },
    {
      // Teams is a collapsible item, target the parent button
      target: '[data-sidebar-item="teams"]',
      title: t("tour.steps.teams.title"),
      content: t("tour.steps.teams.content"),
      position: "right",
    },
    {
      target: '[data-tour="checklist"]',
      title: t("tour.steps.checklist.title", "Setup Checklist"),
      content: t(
        "tour.steps.checklist.content",
        "Track your progress setting up the workspace. Complete these tasks to get started."
      ),
      position: "top",
    },
  ];

  // Only render if this specific tour is open
  const isThisTourOpen = isTourOpen && currentTourId === ADMIN_TOUR_ID;

  return (
    <GuidedTour
      steps={steps}
      isOpen={isThisTourOpen}
      onClose={closeTour}
      onFinish={finishTour}
    />
  );
}
